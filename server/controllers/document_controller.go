package controllers

import (
	"mindoc/database"
	"mindoc/middleware"
	"mindoc/models"
	"mindoc/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CreateDocumentRequest struct {
	Title       string `json:"title" binding:"required,max=200"`
	Content     string `json:"content"`
	ContentType string `json:"content_type"`
	ParentID    uint   `json:"parent_id"`
	SortOrder   int    `json:"sort_order"`
}

type UpdateDocumentRequest struct {
	Title       string `json:"title" binding:"max=200"`
	Content     string `json:"content"`
	ContentType string `json:"content_type"`
	ParentID    *uint  `json:"parent_id"`
	SortOrder   *int   `json:"sort_order"`
	Status      *int   `json:"status"`
}

func GetDocumentList(c *gin.Context) {
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

	parentID, _ := strconv.ParseUint(c.DefaultQuery("parent_id", "0"), 10, 64)

	var documents []models.Document
	query := database.DB.Where("project_id = ? AND parent_id = ?", p.ID, parentID)

	query.Order("sort_order ASC, created_at DESC").Find(&documents)

	utils.Success(c, documents)
}

func GetDocumentByID(c *gin.Context) {
	docID := c.Param("doc_id")

	var document models.Document
	if err := database.DB.Preload("Creator").First(&document, docID).Error; err != nil {
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

	utils.Success(c, document)
}

func CreateDocument(c *gin.Context) {
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

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.Unauthorized(c, "未登录")
		return
	}

	var req CreateDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	contentType := req.ContentType
	if contentType == "" {
		contentType = "markdown"
	}

	document := models.Document{
		Title:       req.Title,
		Content:     req.Content,
		ContentType: contentType,
		ProjectID:   p.ID,
		ParentID:    req.ParentID,
		SortOrder:   req.SortOrder,
		CreatorID:   user.ID,
		Status:      1,
	}

	if err := database.DB.Create(&document).Error; err != nil {
		utils.InternalError(c, "创建文档失败")
		return
	}

	database.DB.Preload("Creator").First(&document, document.ID)
	utils.SuccessWithMessage(c, "创建成功", document)
}

func UpdateDocument(c *gin.Context) {
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

	if document.CreatorID != user.ID && p.OwnerID != user.ID {
		utils.Forbidden(c, "无权限修改该文档")
		return
	}

	var req UpdateDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	if req.Title != "" {
		document.Title = req.Title
	}
	if req.Content != "" {
		document.Content = req.Content
	}
	if req.ContentType != "" {
		document.ContentType = req.ContentType
	}
	if req.ParentID != nil {
		document.ParentID = *req.ParentID
	}
	if req.SortOrder != nil {
		document.SortOrder = *req.SortOrder
	}
	if req.Status != nil {
		document.Status = *req.Status
	}

	if err := database.DB.Save(&document).Error; err != nil {
		utils.InternalError(c, "更新失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", document)
}

func DeleteDocument(c *gin.Context) {
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

	if document.CreatorID != user.ID && p.OwnerID != user.ID {
		utils.Forbidden(c, "无权限删除该文档")
		return
	}

	if err := database.DB.Delete(&document).Error; err != nil {
		utils.InternalError(c, "删除失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}

func GetDocumentTree(c *gin.Context) {
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

	var documents []models.Document
	database.DB.Where("project_id = ?", p.ID).Order("sort_order ASC, created_at ASC").Find(&documents)

	tree := buildDocumentTree(documents, 0)
	utils.Success(c, tree)
}

func buildDocumentTree(documents []models.Document, parentID uint) []map[string]interface{} {
	tree := []map[string]interface{}{}

	for _, doc := range documents {
		if doc.ParentID == parentID {
			node := map[string]interface{}{
				"id":         doc.ID,
				"title":      doc.Title,
				"parent_id":  doc.ParentID,
				"sort_order": doc.SortOrder,
				"children":   buildDocumentTree(documents, doc.ID),
			}
			tree = append(tree, node)
		}
	}

	return tree
}
