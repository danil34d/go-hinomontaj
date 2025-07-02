package service

import (
	"fmt"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
)

type WorkerService interface {
	Create(worker models.Worker) (int, error)
	GetAll() ([]models.Worker, error)
	GetById(id int) (models.Worker, error)
	Update(id int, worker models.Worker) error
	Delete(id int) error
	GetByUserId(userId int) (models.Worker, error)
	GetStatistics(workerId int) (models.WorkerStatistics, error)
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

	logger.Info("Создан новый работник ID:%d", workerId)
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

func (s *WorkerServiceImpl) GetStatistics(workerId int) (models.WorkerStatistics, error) {
	logger.Debug("Получение статистики для работника ID:%d", workerId)
	return s.repo.GetWorkerStatistics(workerId)
}
