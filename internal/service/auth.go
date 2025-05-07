package service

import (
	"errors"
	"go-hinomontaj/pkg/logger"
	"time"

	"go-hinomontaj/models"

	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Register(user models.SignUpInput) (string, models.User, error)
	Login(input models.SignInInput) (string, models.User, error)
}

type AuthServiceImpl struct {
	repo       Repository
	signingKey string
}

func NewAuthService(repo Repository, signingKey string) *AuthServiceImpl {
	return &AuthServiceImpl{
		repo:       repo,
		signingKey: signingKey,
	}
}

func (s *AuthServiceImpl) Register(input models.SignUpInput) (string, models.User, error) {
	logger.Debug("Начало регистрации пользователя: %s", input.Email)

	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Ошибка хеширования пароля: %v", err)
		return "", models.User{}, err
	}

	// Создаем нового пользователя
	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashedPassword),
		Role:     input.Role, // Используем роль из входных данных
	}

	// Сохраняем пользователя в базу
	id, err := s.repo.CreateUser(user)
	if err != nil {
		logger.Error("Ошибка создания пользователя в БД: %v", err)
		return "", models.User{}, err
	}

	// Получаем созданного пользователя
	user, err = s.repo.GetUserById(id)
	if err != nil {
		logger.Error("Ошибка получения созданного пользователя: %v", err)
		return "", models.User{}, err
	}

	// Генерируем JWT токен
	token, err := s.generateToken(user)
	if err != nil {
		logger.Error("Ошибка генерации токена: %v", err)
		return "", models.User{}, err
	}

	logger.Info("Успешная регистрация пользователя: %s", user.Email)
	return token, user, nil
}

func (s *AuthServiceImpl) Login(input models.SignInInput) (string, models.User, error) {
	logger.Debug("Попытка входа пользователя: %s", input.Email)

	// Ищем пользователя по email
	user, err := s.repo.GetUser(input.Email)
	if err != nil {
		logger.Warning("Неудачная попытка входа - пользователь не найден: %s, ошибка: %v", input.Email, err)
		return "", models.User{}, ErrInvalidCredentials
	}

	logger.Debug("Пользователь найден: %s, роль: %s", user.Email, user.Role)

	// Проверяем пароль
	inputPassword := []byte(input.Password)
	hashedPassword := []byte(user.Password)
	logger.Debug("Сравниваем пароли: input=%s, hash=%s", input.Password, user.Password)

	err = bcrypt.CompareHashAndPassword(hashedPassword, inputPassword)
	if err != nil {
		logger.Warning("Неудачная попытка входа - неверный пароль для пользователя: %s, ошибка: %v", input.Email, err)
		return "", models.User{}, ErrInvalidCredentials
	}

	logger.Debug("Пароль верный для пользователя: %s", user.Email)

	// Генерируем JWT токен
	token, err := s.generateToken(user)
	if err != nil {
		logger.Error("Ошибка генерации токена при входе для пользователя %s: %v", user.Email, err)
		return "", models.User{}, err
	}

	logger.Info("Успешный вход пользователя: %s, роль: %s", user.Email, user.Role)
	return token, user, nil
}

func (s *AuthServiceImpl) generateToken(user models.User) (string, error) {
	logger.Debug("Генерация токена для пользователя: %s", user.Email)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(s.signingKey))
	if err != nil {
		logger.Error("Ошибка подписи токена: %v", err)
		return "", err
	}

	return tokenString, nil
}

// ErrInvalidCredentials представляет ошибку неверных учетных данных
var ErrInvalidCredentials = errors.New("неверные учетные данные")
