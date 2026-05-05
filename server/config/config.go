package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Site     SiteConfig
	Admin    AdminConfig
}

type ServerConfig struct {
	Port int
	Mode string
}

type DatabaseConfig struct {
	Type   string
	SQLite SQLiteConfig
	MySQL  MySQLConfig
}

type SQLiteConfig struct {
	DBName string
}

type MySQLConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	DBName   string
	Charset  string
}

type JWTConfig struct {
	Secret string
	Expire int
}

type SiteConfig struct {
	Name           string
	Language       string
	AnonymousAccess bool `mapstructure:"anonymous_access"`
	EnableCaptcha  bool `mapstructure:"enable_captcha"`
}

type AdminConfig struct {
	Username string
	Password string
	Email    string
}

var AppConfig *Config

func InitConfig() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")

	configPath := getConfigPath()
	viper.AddConfigPath(configPath)

	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		fmt.Printf("Error reading config file: %s\n", err)
		os.Exit(1)
	}

	AppConfig = &Config{}
	if err := viper.Unmarshal(AppConfig); err != nil {
		fmt.Printf("Error unmarshal config: %s\n", err)
		os.Exit(1)
	}
}

func getConfigPath() string {
	execPath, err := os.Executable()
	if err != nil {
		return "."
	}

	execDir := filepath.Dir(execPath)
	configPaths := []string{
		"./config",
		filepath.Join(execDir, "config"),
		".",
	}

	for _, p := range configPaths {
		if _, err := os.Stat(filepath.Join(p, "config.yaml")); err == nil {
			return p
		}
	}

	return "."
}

func GetDSN() string {
	db := AppConfig.Database
	switch db.Type {
	case "mysql":
		return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local",
			db.MySQL.Username,
			db.MySQL.Password,
			db.MySQL.Host,
			db.MySQL.Port,
			db.MySQL.DBName,
			db.MySQL.Charset,
		)
	case "sqlite":
		return db.SQLite.DBName
	default:
		return db.SQLite.DBName
	}
}
