package controllers

import (
	"mindoc/database"
	"mindoc/models"
	"mindoc/utils"

	"github.com/gin-gonic/gin"
)

type CreateRoleRequest struct {
	Name        string `json:"name" binding:"required,max=50"`
	DisplayName string `json:"display_name" binding:"required,max=50"`
	Description string `json:"description" binding:"max=255"`
}

type UpdateRoleRequest struct {
	DisplayName string `json:"display_name" binding:"max=50"`
	Description string `json:"description" binding:"max=255"`
}

type UpdateRolePermissionsRequest struct {
	PermissionIDs []uint `json:"permission_ids"`
}

func GetRoleList(c *gin.Context) {
	var roles []models.Role
	database.DB.Preload("Permissions").Find(&roles)

	utils.Success(c, roles)
}

func GetRoleByID(c *gin.Context) {
	id := c.Param("id")

	var role models.Role
	if err := database.DB.Preload("Permissions").First(&role, id).Error; err != nil {
		utils.NotFound(c, "角色不存在")
		return
	}

	utils.Success(c, role)
}

func CreateRole(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	var existingRole models.Role
	if err := database.DB.Where("name = ?", req.Name).First(&existingRole).Error; err == nil {
		utils.BadRequest(c, "角色名称已存在")
		return
	}

	role := models.Role{
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Description: req.Description,
	}

	if err := database.DB.Create(&role).Error; err != nil {
		utils.InternalError(c, "创建角色失败")
		return
	}

	utils.SuccessWithMessage(c, "创建成功", role)
}

func UpdateRole(c *gin.Context) {
	id := c.Param("id")

	var role models.Role
	if err := database.DB.First(&role, id).Error; err != nil {
		utils.NotFound(c, "角色不存在")
		return
	}

	var req UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	if req.DisplayName != "" {
		role.DisplayName = req.DisplayName
	}
	if req.Description != "" {
		role.Description = req.Description
	}

	if err := database.DB.Save(&role).Error; err != nil {
		utils.InternalError(c, "更新失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", role)
}

func DeleteRole(c *gin.Context) {
	id := c.Param("id")

	var role models.Role
	if err := database.DB.First(&role, id).Error; err != nil {
		utils.NotFound(c, "角色不存在")
		return
	}

	if role.Name == "super_admin" || role.Name == "user" || role.Name == "guest" {
		utils.BadRequest(c, "系统默认角色不能删除")
		return
	}

	var userCount int64
	database.DB.Model(&models.User{}).Where("role_id = ?", role.ID).Count(&userCount)
	if userCount > 0 {
		utils.BadRequest(c, "该角色下还有用户，不能删除")
		return
	}

	if err := database.DB.Delete(&role).Error; err != nil {
		utils.InternalError(c, "删除失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}

func UpdateRolePermissions(c *gin.Context) {
	id := c.Param("id")

	var role models.Role
	if err := database.DB.Preload("Permissions").First(&role, id).Error; err != nil {
		utils.NotFound(c, "角色不存在")
		return
	}

	var req UpdateRolePermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	var permissions []models.Permission
	if len(req.PermissionIDs) > 0 {
		database.DB.Find(&permissions, req.PermissionIDs)
	}

	database.DB.Model(&role).Association("Permissions").Replace(permissions)

	utils.SuccessWithMessage(c, "权限更新成功", nil)
}

func GetPermissionList(c *gin.Context) {
	var permissions []models.Permission
	database.DB.Order("module ASC, id ASC").Find(&permissions)

	grouped := make(map[string][]models.Permission)
	for _, p := range permissions {
		grouped[p.Module] = append(grouped[p.Module], p)
	}

	utils.Success(c, permissions)
}
