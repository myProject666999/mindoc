package routes

import (
	"mindoc/controllers"
	"mindoc/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", controllers.Login)
			auth.POST("/register", controllers.Register)
			auth.GET("/me", middleware.JWTAuth(), controllers.GetCurrentUser)
			auth.POST("/logout", middleware.JWTAuth(), controllers.Logout)
		}

		users := api.Group("/users")
		users.Use(middleware.JWTAuth())
		{
			users.GET("", middleware.IsAdmin(), controllers.GetUserList)
			users.GET("/:id", middleware.IsAdmin(), controllers.GetUserByID)
			users.POST("", middleware.IsAdmin(), controllers.CreateUser)
			users.PUT("/:id", middleware.IsAdmin(), controllers.UpdateUser)
			users.DELETE("/:id", middleware.IsAdmin(), controllers.DeleteUser)
		}

		profile := api.Group("/profile")
		profile.Use(middleware.JWTAuth())
		{
			profile.PUT("", controllers.UpdateProfile)
			profile.POST("/change-password", controllers.ChangePassword)
		}

		roles := api.Group("/roles")
		roles.Use(middleware.JWTAuth(), middleware.IsAdmin())
		{
			roles.GET("", controllers.GetRoleList)
			roles.GET("/permissions", controllers.GetPermissionList)
			roles.GET("/:id", controllers.GetRoleByID)
			roles.POST("", controllers.CreateRole)
			roles.PUT("/:id", controllers.UpdateRole)
			roles.DELETE("/:id", controllers.DeleteRole)
			roles.PUT("/:id/permissions", controllers.UpdateRolePermissions)
		}

		projects := api.Group("/projects")
		projects.Use(middleware.OptionalAuth())
		{
			projects.GET("", controllers.GetProjectList)
			projects.GET("/:id", middleware.CheckProjectAccess(), controllers.GetProjectByID)
			projects.GET("/:id/documents/tree", middleware.CheckProjectAccess(), controllers.GetDocumentTree)
			projects.GET("/:id/documents", middleware.CheckProjectAccess(), controllers.GetDocumentList)
			projects.GET("/:id/documents/:doc_id", middleware.CheckProjectAccess(), controllers.GetDocumentByID)
			projects.GET("/:id/documents/:doc_id/comments", middleware.CheckProjectAccess(), controllers.GetDocumentComments)

			projectsAuth := projects.Group("")
			projectsAuth.Use(middleware.JWTAuth())
			{
				projectsAuth.POST("", controllers.CreateProject)
				projectsAuth.PUT("/:id", middleware.CheckProjectAccess(), controllers.UpdateProject)
				projectsAuth.DELETE("/:id", middleware.CheckProjectAccess(), controllers.DeleteProject)
				projectsAuth.POST("/:id/regenerate-token", middleware.CheckProjectAccess(), controllers.RegenerateToken)

				projectsAuth.GET("/:id/members", middleware.CheckProjectAccess(), controllers.GetProjectMembers)
				projectsAuth.POST("/:id/members", middleware.CheckProjectAccess(), controllers.AddProjectMember)
				projectsAuth.PUT("/:id/members/:member_id", middleware.CheckProjectAccess(), controllers.UpdateMemberRole)
				projectsAuth.DELETE("/:id/members/:member_id", middleware.CheckProjectAccess(), controllers.RemoveProjectMember)

				projectsAuth.POST("/:id/documents", middleware.CheckProjectAccess(), controllers.CreateDocument)
				projectsAuth.PUT("/:id/documents/:doc_id", middleware.CheckProjectAccess(), controllers.UpdateDocument)
				projectsAuth.DELETE("/:id/documents/:doc_id", middleware.CheckProjectAccess(), controllers.DeleteDocument)

				projectsAuth.POST("/:id/documents/:doc_id/comments", middleware.CheckProjectAccess(), controllers.CreateComment)
			}
		}

		comments := api.Group("/comments")
		comments.Use(middleware.JWTAuth())
		{
			comments.GET("/my", controllers.GetMyComments)
			comments.DELETE("/:comment_id", controllers.DeleteComment)
			comments.PUT("/:comment_id/status", middleware.IsAdmin(), controllers.UpdateCommentStatus)
		}

		config := api.Group("/config")
		{
			config.GET("/site", controllers.GetSiteConfig)
			config.GET("/languages", controllers.GetSupportedLanguages)

			configAuth := config.Group("")
			configAuth.Use(middleware.JWTAuth(), middleware.IsAdmin())
			{
				configAuth.PUT("/site", controllers.UpdateSiteConfig)
				configAuth.PUT("/:key", controllers.UpdateSiteConfigByKey)
			}
		}
	}
}
