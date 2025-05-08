package service

import (
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
)

type ClientService struct {
	repo Repository
}

func NewClientService(repo Repository) *ClientService {
	return &ClientService{repo: repo}
}

func (s *ClientService) Create(client models.Client) (int, error) {
	logger.Debug("Создание нового клиента в сервисе")
	return s.repo.CreateClient(client)
}

func (s *ClientService) GetAll() ([]models.Client, error) {
	logger.Debug("Получение списка всех клиентов в сервисе")
	return s.repo.GetAllClients()
}

func (s *ClientService) GetById(id int) (models.Client, error) {
	logger.Debug("Получение клиента по ID в сервисе: %d", id)
	return s.repo.GetClientById(id)
}

func (s *ClientService) Update(id int, client models.Client) error {
	logger.Debug("Обновление данных клиента в сервисе: %d", id)
	return s.repo.UpdateClient(id, client)
}

func (s *ClientService) Delete(id int) error {
	logger.Debug("Удаление клиента в сервисе: %d", id)
	return s.repo.DeleteClient(id)
}

func (s *ClientService) GetClientCars(clientId int) ([]models.Car, error) {
	logger.Debug("Получение автомобилей клиента в сервисе: %d", clientId)
	return s.repo.GetClientCars(clientId)
}

func (s *ClientService) AddCarToClient(clientId int, car models.Car) error {
	logger.Debug("Добавление автомобиля клиенту в сервисе: %d", clientId)
	return s.repo.AddCarToClient(clientId, car)
}

func (s *ClientService) GetTypes() ([]string, error) {
	logger.Debug("Получение списка типов клиентов в сервисе")
	return s.repo.GetClientTypes()
}
