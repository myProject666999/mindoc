package main

import (
	"fmt"
	"log"

	"mindoc/config"
	"mindoc/database"
	"mindoc/middleware"
	"mindoc/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	config.InitConfig()

	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	gin.SetMode(config.AppConfig.Server.Mode)
	r := gin.Default()

	r.Use(middleware.CORS())

	routes.SetupRoutes(r)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "MinDoc is running",
		})
	})

	port := config.AppConfig.Server.Port
	fmt.Printf("Server starting on port %d...\n", port)
	if err := r.Run(fmt.Sprintf(":%d", port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
