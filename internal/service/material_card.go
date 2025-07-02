package service

import (
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
)

type MaterialCardService struct {
	repo Repository
}

func NewMaterialCardService(repo Repository) *MaterialCardService {
	return &MaterialCardService{repo: repo}
}

func (s *MaterialCardService) Create(materialCard models.MaterialCard) (int, error) {
	logger.Debug("Создание новой карты материалов в сервисе")
	return s.repo.CreateMaterialCard(materialCard)
}

func (s *MaterialCardService) GetAll() ([]models.MaterialCard, error) {
	logger.Debug("Получение списка всех карт материалов в сервисе")
	return s.repo.GetAllMaterialCards()
}

func (s *MaterialCardService) Update(id int, materialCard models.MaterialCard) error {
	logger.Debug("Обновление карты материалов в сервисе: %d", id)
	return s.repo.UpdateMaterialCard(id, materialCard)
}

func (s *MaterialCardService) Delete(id int) error {
	logger.Debug("Удаление карты материалов в сервисе: %d", id)
	return s.repo.DeleteMaterialCard(id)
} 

func (s *MaterialCardService) GetStorage() (models.Storage, error) {
	logger.Debug("Получение списка материалов на складе")
	return s.repo.GetStorage()
}

func (s *MaterialCardService) AddDelivery(delivery models.Storage) error {
	logger.Debug("Добавление материалов на склад")
	return s.repo.AddDelivery(delivery)
}