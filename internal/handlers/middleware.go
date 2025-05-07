package handlers

import (
	"go-hinomontaj/pkg/auth"
	"go-hinomontaj/pkg/logger"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	authorizationHeader = "Authorization"
	userCtx             = "userId"
	roleCtx             = "userRole"
)

func (h *Handler) authMiddleware(c *gin.Context) {
	logger.Debug("Проверка аутентификации для запроса: %s %s", c.Request.Method, c.Request.URL.Path)

	header := c.GetHeader(authorizationHeader)
	if header == "" {
		logger.Warning("Пустой заголовок авторизации для запроса: %s %s", c.Request.Method, c.Request.URL.Path)
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "пустой заголовок авторизации"})
		return
	}

	headerParts := strings.Split(header, " ")
	if len(headerParts) != 2 || headerParts[0] != "Bearer" {
		logger.Warning("Неверный формат заголовка авторизации: %s", header)
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "неверный формат заголовка авторизации"})
		return
	}

	claims, err := auth.ParseToken(headerParts[1])
	if err != nil {
		logger.Warning("Ошибка проверки токена: %v", err)
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	logger.Debug("Успешная аутентификация пользователя ID:%d, роль:%s", claims.UserId, claims.Role)
	c.Set(userCtx, claims.UserId)
	c.Set(roleCtx, claims.Role)
	c.Next()
}

func (h *Handler) workerRoleMiddleware(c *gin.Context) {
	logger.Debug("Проверка роли worker для запроса: %s %s", c.Request.Method, c.Request.URL.Path)

	role, _ := c.Get(roleCtx)
	if role != "worker" {
		logger.Warning("Попытка доступа к worker endpoint с ролью: %v", role)
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "доступ запрещен"})
		return
	}
	logger.Debug("Доступ разрешен для worker")
	c.Next()
}

func (h *Handler) managerRoleMiddleware(c *gin.Context) {
	logger.Debug("Проверка роли manager для запроса: %s %s", c.Request.Method, c.Request.URL.Path)

	role, _ := c.Get(roleCtx)
	if role != "manager" {
		logger.Warning("Попытка доступа к manager endpoint с ролью: %v", role)
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "доступ запрещен"})
		return
	}
	logger.Debug("Доступ разрешен для manager")
	c.Next()
}
