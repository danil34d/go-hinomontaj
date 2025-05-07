package service

import "go-hinomontaj/models"

type WorkerService interface {
	Create(worker models.Worker) (int, error)
	GetAll() ([]models.Worker, error)
	GetById(id int) (models.Worker, error)
	Update(id int, worker models.Worker) error
	Delete(id int) error
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
	return s.repo.CreateWorker(worker)
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
