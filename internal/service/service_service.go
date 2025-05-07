package service

import (
	"go-hinomontaj/internal/repository/postgres"
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
)

type ServiceService struct {
	repo *postgres.Repository
}

func NewServiceService(repo *postgres.Repository) *ServiceService {
	return &ServiceService{repo: repo}
}

func (s *ServiceService) Create(service models.Service) (int, error) {
	logger.Debug("Создание новой услуги: %s", service.Name)
	return s.repo.CreateService(service)
}

func (s *ServiceService) GetAll() ([]models.Service, error) {
	logger.Debug("Получение списка всех услуг")
	return s.repo.GetAllServices()
}

func (s *ServiceService) Update(id int, service models.Service) error {
	logger.Debug("Обновление услуги ID:%d", id)
	return s.repo.UpdateService(id, service)
}

func (s *ServiceService) Delete(id int) error {
	logger.Debug("Удаление услуги ID:%d", id)
	return s.repo.DeleteService(id)
}
