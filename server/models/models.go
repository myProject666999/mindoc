package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Username  string         `json:"username" gorm:"uniqueIndex;size:50;not null"`
	Email     string         `json:"email" gorm:"uniqueIndex;size:100;not null"`
	Password  string         `json:"-" gorm:"size:255;not null"`
	Nickname  string         `json:"nickname" gorm:"size:50"`
	Avatar    string         `json:"avatar" gorm:"size:255"`
	RoleID    uint           `json:"role_id" gorm:"default:2"`
	Role      Role           `json:"role,omitempty" gorm:"foreignKey:RoleID"`
	Status    int            `json:"status" gorm:"default:1"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

type Role struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"uniqueIndex;size:50;not null"`
	DisplayName string         `json:"display_name" gorm:"size:50;not null"`
	Description string         `json:"description" gorm:"size:255"`
	Permissions []Permission   `json:"permissions,omitempty" gorm:"many2many:role_permissions;"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

type Permission struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"uniqueIndex;size:50;not null"`
	DisplayName string    `json:"display_name" gorm:"size:50;not null"`
	Module      string    `json:"module" gorm:"size:50;not null"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Project struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"size:100;not null"`
	Description string         `json:"description" gorm:"size:500"`
	Icon        string         `json:"icon" gorm:"size:255"`
	Visibility  int            `json:"visibility" gorm:"default:1"`
	AccessToken string        `json:"-" gorm:"size:64;index"`
	OwnerID     uint           `json:"owner_id" gorm:"not null;index"`
	Owner       User           `json:"owner,omitempty" gorm:"foreignKey:OwnerID"`
	SortOrder   int            `json:"sort_order" gorm:"default:0"`
	Status      int            `json:"status" gorm:"default:1"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	Members     []ProjectMember `json:"members,omitempty" gorm:"foreignKey:ProjectID"`
	Documents   []Document     `json:"-" gorm:"foreignKey:ProjectID"`
}

type ProjectMember struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	ProjectID uint      `json:"project_id" gorm:"not null;index:idx_project_member,unique"`
	UserID    uint      `json:"user_id" gorm:"not null;index:idx_project_member,unique"`
	Role      int       `json:"role" gorm:"default:1"`
	User      User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Document struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Title       string         `json:"title" gorm:"size:200;not null"`
	Content     string         `json:"content" gorm:"type:text"`
	ContentType string         `json:"content_type" gorm:"size:20;default:markdown"`
	ProjectID   uint           `json:"project_id" gorm:"not null;index"`
	ParentID    uint           `json:"parent_id" gorm:"default:0;index"`
	Path        string         `json:"path" gorm:"size:500;index"`
	SortOrder   int            `json:"sort_order" gorm:"default:0"`
	CreatorID   uint           `json:"creator_id" gorm:"not null"`
	Creator     User           `json:"creator,omitempty" gorm:"foreignKey:CreatorID"`
	Status      int            `json:"status" gorm:"default:1"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

type Comment struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	Content    string         `json:"content" gorm:"type:text;not null"`
	DocumentID uint           `json:"document_id" gorm:"not null;index"`
	UserID     uint           `json:"user_id" gorm:"not null;index"`
	User       User           `json:"user,omitempty" gorm:"foreignKey:UserID"`
	ParentID   uint           `json:"parent_id" gorm:"default:0;index"`
	Status     int            `json:"status" gorm:"default:1"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

type SiteConfig struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Key         string    `json:"key" gorm:"uniqueIndex;size:50;not null"`
	Value       string    `json:"value" gorm:"type:text"`
	Description string    `json:"description" gorm:"size:255"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (u *User) SetPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

func InitDB(db *gorm.DB) error {
	err := db.AutoMigrate(
		&Role{},
		&Permission{},
		&User{},
		&Project{},
		&ProjectMember{},
		&Document{},
		&Comment{},
		&SiteConfig{},
	)
	if err != nil {
		return err
	}

	return initDefaultData(db)
}

func initDefaultData(db *gorm.DB) error {
	var count int64
	db.Model(&Role{}).Count(&count)
	if count > 0 {
		return nil
	}

	roles := []Role{
		{Name: "super_admin", DisplayName: "超级管理员", Description: "系统超级管理员，拥有所有权限"},
		{Name: "user", DisplayName: "普通用户", Description: "普通注册用户"},
		{Name: "guest", DisplayName: "访客", Description: "匿名访客"},
	}

	if err := db.Create(&roles).Error; err != nil {
		return err
	}

	permissions := []Permission{
		{Name: "user:manage", DisplayName: "用户管理", Module: "user"},
		{Name: "user:view", DisplayName: "查看用户", Module: "user"},
		{Name: "role:manage", DisplayName: "角色管理", Module: "role"},
		{Name: "project:manage", DisplayName: "项目管理", Module: "project"},
		{Name: "project:create", DisplayName: "创建项目", Module: "project"},
		{Name: "project:view", DisplayName: "查看项目", Module: "project"},
		{Name: "document:manage", DisplayName: "文档管理", Module: "document"},
		{Name: "document:create", DisplayName: "创建文档", Module: "document"},
		{Name: "document:view", DisplayName: "查看文档", Module: "document"},
		{Name: "comment:manage", DisplayName: "评论管理", Module: "comment"},
		{Name: "comment:create", DisplayName: "创建评论", Module: "comment"},
		{Name: "config:manage", DisplayName: "站点配置", Module: "config"},
	}

	if err := db.Create(&permissions).Error; err != nil {
		return err
	}

	var superAdminRole Role
	db.Where("name = ?", "super_admin").First(&superAdminRole)
	if superAdminRole.ID > 0 {
		db.Model(&superAdminRole).Association("Permissions").Append(&permissions)
	}

	return nil
}
