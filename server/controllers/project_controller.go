package controllers

import (
	"mindoc/database"
	"mindoc/middleware"
	"mindoc/models"
	"mindoc/utils"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateProjectRequest struct {
	Name        string `json:"name" binding:"required,max=100"`
	Description string `json:"description" binding:"max=500"`
	Icon        string `json:"icon"`
	Visibility  int    `json:"visibility"`
}

type UpdateProjectRequest struct {
	Name        string `json:"name" binding:"max=100"`
	Description string `json:"description" binding:"max=500"`
	Icon        string `json:"icon"`
	Visibility  *int   `json:"visibility"`
	SortOrder   *int   `json:"sort_order"`
	Status      *int   `json:"status"`
}

type AddMemberRequest struct {
	UserID uint `json:"user_id" binding:"required"`
	Role   int  `json:"role"`
}

type UpdateMemberRoleRequest struct {
	Role int `json:"role" binding:"required"`
}

func GetProjectList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	keyword := c.Query("keyword")
	visibility := c.Query("visibility")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	var projects []models.Project

	query := database.DB.Model(&models.Project{}).Preload("Owner").Preload("Members.User")

	userID, exists := c.Get("user_id")
	if !exists {
		query = query.Where("visibility = ?", 1)
	} else {
		var memberProjectIDs []uint
		database.DB.Model(&models.ProjectMember{}).Where("user_id = ?", userID).Pluck("project_id", &memberProjectIDs)

		if len(memberProjectIDs) > 0 {
			query = query.Where("(visibility = ? OR owner_id = ? OR id IN ?)", 1, userID, memberProjectIDs)
		} else {
			query = query.Where("(visibility = ? OR owner_id = ?)", 1, userID)
		}
	}

	if keyword != "" {
		query = query.Where("name LIKE ? OR description LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	if visibility != "" {
		v, _ := strconv.Atoi(visibility)
		query = query.Where("visibility = ?", v)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("sort_order ASC, created_at DESC").Offset(offset).Limit(pageSize).Find(&projects)

	utils.SuccessPagination(c, page, pageSize, total, projects)
}

func GetProjectByID(c *gin.Context) {
	projectID := c.Param("id")

	var p models.Project
	if err := database.DB.Preload("Owner").Preload("Members.User").First(&p, projectID).Error; err != nil {
		utils.NotFound(c, "项目不存在")
		return
	}

	utils.Success(c, p)
}

func CreateProject(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.Unauthorized(c, "未登录")
		return
	}

	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	visibility := req.Visibility
	if visibility == 0 {
		visibility = 1
	}

	project := models.Project{
		Name:        req.Name,
		Description: req.Description,
		Icon:        req.Icon,
		Visibility:  visibility,
		OwnerID:     user.ID,
		Status:      1,
	}

	if visibility == 2 {
		project.AccessToken = uuid.New().String()
	}

	if err := database.DB.Create(&project).Error; err != nil {
		utils.InternalError(c, "创建项目失败")
		return
	}

	database.DB.Preload("Owner").First(&project, project.ID)
	utils.SuccessWithMessage(c, "创建成功", project)
}

func UpdateProject(c *gin.Context) {
	project, exists := c.Get("project")
	if !exists {
		utils.NotFound(c, "项目不存在")
		return
	}

	p, ok := project.(models.Project)
	if !ok {
		utils.NotFound(c, "项目不存在")
		return
	}

	userID, hasUser := c.Get("user_id")
	if !hasUser {
		utils.Forbidden(c, "无权限修改")
		return
	}

	if p.OwnerID != userID.(uint) {
		utils.Forbidden(c, "只有项目所有者可以修改")
		return
	}

	var req UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	if req.Name != "" {
		p.Name = req.Name
	}
	if req.Description != "" {
		p.Description = req.Description
	}
	if req.Icon != "" {
		p.Icon = req.Icon
	}
	if req.Visibility != nil {
		p.Visibility = *req.Visibility
		if *req.Visibility == 2 && p.AccessToken == "" {
			p.AccessToken = uuid.New().String()
		}
	}
	if req.SortOrder != nil {
		p.SortOrder = *req.SortOrder
	}
	if req.Status != nil {
		p.Status = *req.Status
	}

	if err := database.DB.Save(&p).Error; err != nil {
		utils.InternalError(c, "更新失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", p)
}

func DeleteProject(c *gin.Context) {
	project, exists := c.Get("project")
	if !exists {
		utils.NotFound(c, "项目不存在")
		return
	}

	p, ok := project.(models.Project)
	if !ok {
		utils.NotFound(c, "项目不存在")
		return
	}

	userID, hasUser := c.Get("user_id")
	if !hasUser {
		utils.Forbidden(c, "无权限删除")
		return
	}

	if p.OwnerID != userID.(uint) {
		utils.Forbidden(c, "只有项目所有者可以删除")
		return
	}

	if err := database.DB.Delete(&p).Error; err != nil {
		utils.InternalError(c, "删除失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}

func RegenerateToken(c *gin.Context) {
	project, exists := c.Get("project")
	if !exists {
		utils.NotFound(c, "项目不存在")
		return
	}

	p, ok := project.(models.Project)
	if !ok {
		utils.NotFound(c, "项目不存在")
		return
	}

	userID, hasUser := c.Get("user_id")
	if !hasUser {
		utils.Forbidden(c, "无权限")
		return
	}

	if p.OwnerID != userID.(uint) {
		utils.Forbidden(c, "只有项目所有者可以操作")
		return
	}

	p.AccessToken = uuid.New().String()
	if err := database.DB.Save(&p).Error; err != nil {
		utils.InternalError(c, "更新失败")
		return
	}

	utils.SuccessWithMessage(c, "Token已重置", gin.H{"access_token": p.AccessToken})
}

func GetProjectMembers(c *gin.Context) {
	project, exists := c.Get("project")
	if !exists {
		utils.NotFound(c, "项目不存在")
		return
	}

	p, ok := project.(models.Project)
	if !ok {
		utils.NotFound(c, "项目不存在")
		return
	}

	var members []models.ProjectMember
	database.DB.Preload("User").Where("project_id = ?", p.ID).Find(&members)

	utils.Success(c, members)
}

func AddProjectMember(c *gin.Context) {
	project, exists := c.Get("project")
	if !exists {
		utils.NotFound(c, "项目不存在")
		return
	}

	p, ok := project.(models.Project)
	if !ok {
		utils.NotFound(c, "项目不存在")
		return
	}

	userID, hasUser := c.Get("user_id")
	if !hasUser {
		utils.Forbidden(c, "无权限")
		return
	}

	if p.OwnerID != userID.(uint) {
		utils.Forbidden(c, "只有项目所有者可以添加成员")
		return
	}

	var req AddMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	var existingMember models.ProjectMember
	if err := database.DB.Where("project_id = ? AND user_id = ?", p.ID, req.UserID).First(&existingMember).Error; err == nil {
		utils.BadRequest(c, "该用户已是项目成员")
		return
	}

	var user models.User
	if err := database.DB.First(&user, req.UserID).Error; err != nil {
		utils.NotFound(c, "用户不存在")
		return
	}

	role := req.Role
	if role == 0 {
		role = 1
	}

	member := models.ProjectMember{
		ProjectID: p.ID,
		UserID:    req.UserID,
		Role:      role,
	}

	if err := database.DB.Create(&member).Error; err != nil {
		utils.InternalError(c, "添加成员失败")
		return
	}

	database.DB.Preload("User").First(&member, member.ID)
	utils.SuccessWithMessage(c, "添加成功", member)
}

func UpdateMemberRole(c *gin.Context) {
	project, exists := c.Get("project")
	if !exists {
		utils.NotFound(c, "项目不存在")
		return
	}

	p, ok := project.(models.Project)
	if !ok {
		utils.NotFound(c, "项目不存在")
		return
	}

	userID, hasUser := c.Get("user_id")
	if !hasUser {
		utils.Forbidden(c, "无权限")
		return
	}

	if p.OwnerID != userID.(uint) {
		utils.Forbidden(c, "只有项目所有者可以修改成员角色")
		return
	}

	memberID := c.Param("member_id")
	var member models.ProjectMember
	if err := database.DB.Where("id = ? AND project_id = ?", memberID, p.ID).First(&member).Error; err != nil {
		utils.NotFound(c, "成员不存在")
		return
	}

	var req UpdateMemberRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	member.Role = req.Role
	if err := database.DB.Save(&member).Error; err != nil {
		utils.InternalError(c, "更新失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", member)
}

func RemoveProjectMember(c *gin.Context) {
	project, exists := c.Get("project")
	if !exists {
		utils.NotFound(c, "项目不存在")
		return
	}

	p, ok := project.(models.Project)
	if !ok {
		utils.NotFound(c, "项目不存在")
		return
	}

	userID, hasUser := c.Get("user_id")
	if !hasUser {
		utils.Forbidden(c, "无权限")
		return
	}

	if p.OwnerID != userID.(uint) {
		utils.Forbidden(c, "只有项目所有者可以移除成员")
		return
	}

	memberID := c.Param("member_id")
	var member models.ProjectMember
	if err := database.DB.Where("id = ? AND project_id = ?", memberID, p.ID).First(&member).Error; err != nil {
		utils.NotFound(c, "成员不存在")
		return
	}

	if err := database.DB.Delete(&member).Error; err != nil {
		utils.InternalError(c, "移除失败")
		return
	}

	utils.SuccessWithMessage(c, "移除成功", nil)
}
