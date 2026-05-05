package controllers

import (
	"mindoc/database"
	"mindoc/middleware"
	"mindoc/models"
	"mindoc/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

type UpdateProfileRequest struct {
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
	Avatar   string `json:"avatar"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

type CreateUserRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Nickname string `json:"nickname"`
	RoleID   uint   `json:"role_id"`
}

type UpdateUserRequest struct {
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
	Avatar   string `json:"avatar"`
	RoleID   uint   `json:"role_id"`
	Status   *int   `json:"status"`
}

func GetUserList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	var total int64
	var users []models.User

	query := database.DB.Model(&models.User{}).Preload("Role")

	if keyword != "" {
		query = query.Where("username LIKE ? OR email LIKE ? OR nickname LIKE ?",
			"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&users)

	utils.SuccessPagination(c, page, pageSize, total, users)
}

func GetUserByID(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := database.DB.Preload("Role").First(&user, id).Error; err != nil {
		utils.NotFound(c, "用户不存在")
		return
	}

	utils.Success(c, user)
}

func CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	var existingUser models.User
	if err := database.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		utils.BadRequest(c, "用户名已存在")
		return
	}

	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		utils.BadRequest(c, "邮箱已被注册")
		return
	}

	roleID := req.RoleID
	if roleID == 0 {
		var userRole models.Role
		if err := database.DB.Where("name = ?", "user").First(&userRole).Error; err != nil {
			utils.InternalError(c, "系统错误")
			return
		}
		roleID = userRole.ID
	}

	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Nickname: req.Nickname,
		RoleID:   roleID,
		Status:   1,
	}

	if err := user.SetPassword(req.Password); err != nil {
		utils.InternalError(c, "密码加密失败")
		return
	}

	if err := database.DB.Create(&user).Error; err != nil {
		utils.InternalError(c, "创建用户失败")
		return
	}

	utils.SuccessWithMessage(c, "创建成功", user)
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		utils.NotFound(c, "用户不存在")
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	if req.Nickname != "" {
		user.Nickname = req.Nickname
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Avatar != "" {
		user.Avatar = req.Avatar
	}
	if req.RoleID != 0 {
		user.RoleID = req.RoleID
	}
	if req.Status != nil {
		user.Status = *req.Status
	}

	if err := database.DB.Save(&user).Error; err != nil {
		utils.InternalError(c, "更新失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", user)
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	currentUser := middleware.GetCurrentUser(c)
	if currentUser != nil && strconv.Itoa(int(currentUser.ID)) == id {
		utils.BadRequest(c, "不能删除自己")
		return
	}

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		utils.NotFound(c, "用户不存在")
		return
	}

	if err := database.DB.Delete(&user).Error; err != nil {
		utils.InternalError(c, "删除失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}

func UpdateProfile(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.Unauthorized(c, "未登录")
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	if req.Nickname != "" {
		user.Nickname = req.Nickname
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Avatar != "" {
		user.Avatar = req.Avatar
	}

	if err := database.DB.Save(user).Error; err != nil {
		utils.InternalError(c, "更新失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", user)
}

func ChangePassword(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.Unauthorized(c, "未登录")
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	if !user.CheckPassword(req.OldPassword) {
		utils.BadRequest(c, "原密码错误")
		return
	}

	if err := user.SetPassword(req.NewPassword); err != nil {
		utils.InternalError(c, "密码加密失败")
		return
	}

	if err := database.DB.Save(user).Error; err != nil {
		utils.InternalError(c, "更新密码失败")
		return
	}

	utils.SuccessWithMessage(c, "密码修改成功", nil)
}
