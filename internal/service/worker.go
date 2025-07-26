package service

import (
	"fmt"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
	"time"
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

func (s *WorkerServiceImpl) GetStatistics(workerId int, start time.Time, end time.Time) (models.WorkerStatistics, error) {
	return s.repo.GetWorkerStatistic(workerId, start, end)
}

func (s *WorkerServiceImpl) AddBonus(bonus models.PenaltyOrBonus) error {
	return s.repo.AddBonus(bonus)
}

func (s *WorkerServiceImpl) GetBonuses(workerID int) ([]models.PenaltyOrBonus, error) {
	return s.repo.GetBonuses(workerID)
}

func (s *WorkerServiceImpl) AddPenalty(penalty models.PenaltyOrBonus) error {
	return s.repo.AddPenalty(penalty)
}

func (s *WorkerServiceImpl) GetPenalties(workerID int) ([]models.PenaltyOrBonus, error) {
	return s.repo.GetPenalties(workerID)
}

// считает зп за сутки +24 часа от старт для рбаотника, пока если схема не известна возвращает просто всю выручку с заказов
func (s *WorkerServiceImpl) Salary(workerID int, start time.Time) (int, error) {
	stats, err := s.GetStatistics(workerID, start, start.Add(24*time.Hour))
	if err != nil {
		return 0, err
	}
	worker, err := s.repo.GetWorkerById(workerID)
	if err != nil {
		return 0, err
	}

	if stats.SalarySchema == "Процентная" {
		return stats.TotalRevenue * (worker.Salary / 100), nil // делим на 100 чтоб получить процент
	}

	if stats.SalarySchema == "Фиксированная" {
		return worker.Salary, nil // если нет схемы то просто возвращаем сумму
	}

	return stats.TotalRevenue, nil // если нет схемы то просто возвращаем сумму
}
