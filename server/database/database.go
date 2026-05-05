package database

import (
	"fmt"

	"mindoc/config"
	"mindoc/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	sqlite "github.com/glebarez/sqlite"
)

var DB *gorm.DB

func InitDB() error {
	var err error
	dsn := config.GetDSN()

	switch config.AppConfig.Database.Type {
	case "mysql":
		DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	case "sqlite":
		DB, err = gorm.Open(sqlite.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	default:
		DB, err = gorm.Open(sqlite.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	}

	if err != nil {
		return fmt.Errorf("failed to connect database: %w", err)
	}

	if err = models.InitDB(DB); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	if err = InitAdminUser(); err != nil {
		return fmt.Errorf("failed to init admin user: %w", err)
	}

	return nil
}

func InitAdminUser() error {
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		return nil
	}

	adminConfig := config.AppConfig.Admin
	var adminRole models.Role
	if err := DB.Where("name = ?", "super_admin").First(&adminRole).Error; err != nil {
		return err
	}

	admin := &models.User{
		Username: adminConfig.Username,
		Email:    adminConfig.Email,
		Nickname: "系统管理员",
		RoleID:   adminRole.ID,
		Status:   1,
	}

	if err := admin.SetPassword(adminConfig.Password); err != nil {
		return err
	}

	return DB.Create(admin).Error
}
