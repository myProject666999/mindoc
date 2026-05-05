package middleware

import (
	"mindoc/config"
	"mindoc/database"
	"mindoc/models"
	"mindoc/utils"
	"strings"

	"github.com/gin-gonic/gin"
)

func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "未登录或登录已过期")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			utils.Unauthorized(c, "认证格式错误")
			c.Abort()
			return
		}

		claims, err := utils.ParseToken(parts[1])
		if err != nil {
			utils.Unauthorized(c, "登录已过期，请重新登录")
			c.Abort()
			return
		}

		var user models.User
		if err := database.DB.Preload("Role").First(&user, claims.UserID).Error; err != nil {
			utils.Unauthorized(c, "用户不存在")
			c.Abort()
			return
		}

		if user.Status != 1 {
			utils.Forbidden(c, "账户已被禁用")
			c.Abort()
			return
		}

		c.Set("user", user)
		c.Set("user_id", user.ID)
		c.Set("role_id", user.RoleID)
		c.Next()
	}
}

func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.Next()
			return
		}

		claims, err := utils.ParseToken(parts[1])
		if err != nil {
			c.Next()
			return
		}

		var user models.User
		if err := database.DB.Preload("Role").First(&user, claims.UserID).Error; err != nil {
			c.Next()
			return
		}

		if user.Status != 1 {
			c.Next()
			return
		}

		c.Set("user", user)
		c.Set("user_id", user.ID)
		c.Set("role_id", user.RoleID)
		c.Next()
	}
}

func RequirePermission(permissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			utils.Forbidden(c, "无权限访问")
			c.Abort()
			return
		}

		u, ok := user.(models.User)
		if !ok {
			utils.Forbidden(c, "无权限访问")
			c.Abort()
			return
		}

		if u.Role.Name == "super_admin" {
			c.Next()
			return
		}

		var role models.Role
		if err := database.DB.Preload("Permissions").First(&role, u.RoleID).Error; err != nil {
			utils.Forbidden(c, "无权限访问")
			c.Abort()
			return
		}

		hasPermission := false
		for _, perm := range role.Permissions {
			for _, required := range permissions {
				if perm.Name == required {
					hasPermission = true
					break
				}
			}
			if hasPermission {
				break
			}
		}

		if !hasPermission {
			utils.Forbidden(c, "无权限访问")
			c.Abort()
			return
		}

		c.Next()
	}
}

func IsAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			utils.Forbidden(c, "需要管理员权限")
			c.Abort()
			return
		}

		u, ok := user.(models.User)
		if !ok {
			utils.Forbidden(c, "需要管理员权限")
			c.Abort()
			return
		}

		if u.Role.Name != "super_admin" {
			utils.Forbidden(c, "需要管理员权限")
			c.Abort()
			return
		}

		c.Next()
	}
}

func CheckProjectAccess() gin.HandlerFunc {
	return func(c *gin.Context) {
		projectID := c.Param("id")
		if projectID == "" {
			utils.NotFound(c, "项目不存在")
			c.Abort()
			return
		}

		var project models.Project
		if err := database.DB.First(&project, projectID).Error; err != nil {
			utils.NotFound(c, "项目不存在")
			c.Abort()
			return
		}

		if project.Visibility == 1 {
			c.Set("project", project)
			c.Next()
			return
		}

		userID, exists := c.Get("user_id")
		if !exists {
			accessToken := c.Query("token")
			if accessToken != "" && project.AccessToken == accessToken {
				c.Set("project", project)
				c.Next()
				return
			}

			utils.Forbidden(c, "该项目为私有项目，需要登录或Token访问")
			c.Abort()
			return
		}

		if project.OwnerID == userID.(uint) {
			c.Set("project", project)
			c.Next()
			return
		}

		var member models.ProjectMember
		if err := database.DB.Where("project_id = ? AND user_id = ?", project.ID, userID).First(&member).Error; err == nil {
			c.Set("project", project)
			c.Set("project_member_role", member.Role)
			c.Next()
			return
		}

		accessToken := c.Query("token")
		if accessToken != "" && project.AccessToken == accessToken {
			c.Set("project", project)
			c.Next()
			return
		}

		utils.Forbidden(c, "无权限访问该项目")
		c.Abort()
	}
}

func GetCurrentUser(c *gin.Context) *models.User {
	user, exists := c.Get("user")
	if !exists {
		return nil
	}
	u, ok := user.(models.User)
	if !ok {
		return nil
	}
	return &u
}

func GetSiteConfig() *config.SiteConfig {
	return &config.AppConfig.Site
}
