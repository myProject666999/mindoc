package controllers

import (
	"mindoc/database"
	"mindoc/middleware"
	"mindoc/models"
	"mindoc/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CreateCommentRequest struct {
	Content  string `json:"content" binding:"required"`
	ParentID uint   `json:"parent_id"`
}

func GetDocumentComments(c *gin.Context) {
	docID := c.Param("doc_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	var comments []models.Comment

	query := database.DB.Model(&models.Comment{}).Preload("User").Where("document_id = ? AND parent_id = 0", docID)

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&comments)

	utils.SuccessPagination(c, page, pageSize, total, comments)
}

func GetMyComments(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.Unauthorized(c, "未登录")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	var comments []models.Comment

	query := database.DB.Model(&models.Comment{}).Preload("User").Where("user_id = ?", user.ID)

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&comments)

	utils.SuccessPagination(c, page, pageSize, total, comments)
}

func CreateComment(c *gin.Context) {
	docID := c.Param("doc_id")

	var document models.Document
	if err := database.DB.First(&document, docID).Error; err != nil {
		utils.NotFound(c, "文档不存在")
		return
	}

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

	if document.ProjectID != p.ID {
		utils.Forbidden(c, "文档不属于该项目")
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.Unauthorized(c, "未登录")
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	comment := models.Comment{
		Content:    req.Content,
		DocumentID: document.ID,
		UserID:     user.ID,
		ParentID:   req.ParentID,
		Status:     1,
	}

	if err := database.DB.Create(&comment).Error; err != nil {
		utils.InternalError(c, "创建评论失败")
		return
	}

	database.DB.Preload("User").First(&comment, comment.ID)
	utils.SuccessWithMessage(c, "评论成功", comment)
}

func DeleteComment(c *gin.Context) {
	commentID := c.Param("comment_id")

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.Unauthorized(c, "未登录")
		return
	}

	var comment models.Comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		utils.NotFound(c, "评论不存在")
		return
	}

	if comment.UserID != user.ID && user.Role.Name != "super_admin" {
		utils.Forbidden(c, "无权限删除该评论")
		return
	}

	if err := database.DB.Delete(&comment).Error; err != nil {
		utils.InternalError(c, "删除失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}

func UpdateCommentStatus(c *gin.Context) {
	commentID := c.Param("comment_id")

	var comment models.Comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		utils.NotFound(c, "评论不存在")
		return
	}

	var req struct {
		Status int `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	comment.Status = req.Status
	if err := database.DB.Save(&comment).Error; err != nil {
		utils.InternalError(c, "更新失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", comment)
}
