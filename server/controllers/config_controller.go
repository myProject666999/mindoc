package controllers

import (
	"mindoc/config"
	"mindoc/database"
	"mindoc/models"
	"mindoc/utils"

	"github.com/gin-gonic/gin"
)

func GetSiteConfig(c *gin.Context) {
	siteConfig := config.AppConfig.Site

	var dbConfigs []models.SiteConfig
	database.DB.Find(&dbConfigs)

	configMap := make(map[string]string)
	for _, cfg := range dbConfigs {
		configMap[cfg.Key] = cfg.Value
	}

	utils.Success(c, gin.H{
		"name":             siteConfig.Name,
		"language":         siteConfig.Language,
		"anonymous_access": siteConfig.AnonymousAccess,
		"enable_captcha":   siteConfig.EnableCaptcha,
		"db_configs":       configMap,
	})
}

func UpdateSiteConfig(c *gin.Context) {
	var req struct {
		Name            string `json:"name"`
		Language        string `json:"language"`
		AnonymousAccess *bool  `json:"anonymous_access"`
		EnableCaptcha   *bool  `json:"enable_captcha"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	if req.Name != "" {
		config.AppConfig.Site.Name = req.Name
	}
	if req.Language != "" {
		config.AppConfig.Site.Language = req.Language
	}
	if req.AnonymousAccess != nil {
		config.AppConfig.Site.AnonymousAccess = *req.AnonymousAccess
	}
	if req.EnableCaptcha != nil {
		config.AppConfig.Site.EnableCaptcha = *req.EnableCaptcha
	}

	utils.SuccessWithMessage(c, "更新成功", gin.H{
		"name":             config.AppConfig.Site.Name,
		"language":         config.AppConfig.Site.Language,
		"anonymous_access": config.AppConfig.Site.AnonymousAccess,
		"enable_captcha":   config.AppConfig.Site.EnableCaptcha,
	})
}

func GetSupportedLanguages(c *gin.Context) {
	languages := []map[string]string{
		{"code": "zh-CN", "name": "简体中文"},
		{"code": "zh-TW", "name": "繁體中文"},
		{"code": "en-US", "name": "English"},
		{"code": "ja-JP", "name": "日本語"},
	}

	utils.Success(c, languages)
}

func UpdateSiteConfigByKey(c *gin.Context) {
	key := c.Param("key")

	var req struct {
		Value       string `json:"value"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	var siteConfig models.SiteConfig
	if err := database.DB.Where("key = ?", key).First(&siteConfig).Error; err != nil {
		siteConfig = models.SiteConfig{
			Key:         key,
			Value:       req.Value,
			Description: req.Description,
		}
		if err := database.DB.Create(&siteConfig).Error; err != nil {
			utils.InternalError(c, "创建配置失败")
			return
		}
	} else {
		siteConfig.Value = req.Value
		if req.Description != "" {
			siteConfig.Description = req.Description
		}
		if err := database.DB.Save(&siteConfig).Error; err != nil {
			utils.InternalError(c, "更新配置失败")
			return
		}
	}

	utils.SuccessWithMessage(c, "更新成功", siteConfig)
}
