package service

import (
	"fmt"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"

	"golang.org/x/crypto/bcrypt"
)

type WorkerService interface {
	Create(worker models.Worker) (int, error)
	GetAll() ([]models.Worker, error)
	GetById(id int) (models.Worker, error)
	Update(id int, worker models.Worker) error
	Delete(id int) error
	GetByUserId(userId int) (models.Worker, error)
}

type WorkerServiceImpl struct {
	repo Repository
}

func NewWorkerService(repo Repository) *WorkerServiceImpl {
	return &WorkerServiceImpl{
		repo: repo,
	}
}

func (s *WorkerServiceImpl) Create(worker models.Worker) (int, error) {
	// Создаем работника
	workerId, err := s.repo.CreateWorker(worker)
	if err != nil {
		logger.Error("Ошибка при создании работника: %v", err)
		return 0, fmt.Errorf("ошибка при создании работника: %w", err)
	}

	// Генерируем email и пароль для пользователя
	email := fmt.Sprintf("%s.%s@hinomontaj.com", worker.Name, worker.Surname)
	password := "default123" // В продакшене нужно генерировать случайный пароль

	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Ошибка хеширования пароля: %v", err)
		return 0, fmt.Errorf("ошибка при создании пользователя: %w", err)
	}

	// Создаем пользователя
	user := models.User{
		Name:     worker.Name,
		Email:    email,
		Password: string(hashedPassword),
		Role:     "worker",
	}

	_, err = s.repo.CreateUser(user)
	if err != nil {
		logger.Error("Ошибка при создании пользователя для работника: %v", err)
		return 0, fmt.Errorf("ошибка при создании пользователя: %w", err)
	}

	logger.Info("Создан новый работник ID:%d с учетной записью %s", workerId, email)
	return workerId, nil
}

func (s *WorkerServiceImpl) GetAll() ([]models.Worker, error) {
	return s.repo.GetAllWorkers()
}

func (s *WorkerServiceImpl) GetById(id int) (models.Worker, error) {
	return s.repo.GetWorkerById(id)
}

func (s *WorkerServiceImpl) Update(id int, worker models.Worker) error {
	return s.repo.UpdateWorker(id, worker)
}

func (s *WorkerServiceImpl) Delete(id int) error {
	return s.repo.DeleteWorker(id)
}

func (s *WorkerServiceImpl) GetByUserId(userId int) (models.Worker, error) {
	logger.Debug("Получение данных работника по user_id: %d", userId)
	return s.repo.GetWorkerByUserId(userId)
}
