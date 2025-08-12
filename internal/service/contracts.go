package service

import (
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
)

type ContractService struct {
	repo Repository
}

func NewContractService(repo Repository) *ContractService {
	return &ContractService{repo: repo}	
}


func (s *ContractService) Create(contract models.Contract) (int, error) {
	logger.Debug("Создание нового договора в сервисе")
	return s.repo.CreateContract(contract)
}

func (s *ContractService) GetAll() ([]models.Contract, error) {
	logger.Debug("Получение списка всех договоров в сервисе")
	return s.repo.GetAllContracts()
}


func (s *ContractService) Update(id int, contract models.Contract) error {
	logger.Debug("Обновление договора в сервисе: %d", id)
	return s.repo.UpdateContract(id, contract)
}

func (s *ContractService) Delete(id int) error {
	logger.Debug("Удаление договора в сервисе: %d", id)
	return s.repo.DeleteContract(id)
}

func (s *ContractService) AddServicesToContract(contractID int, services []models.Service) error {
	logger.Debug("Добавление услуг к договору в сервисе: %d", contractID)
	return s.repo.AddServicesToContract(contractID, services)
}