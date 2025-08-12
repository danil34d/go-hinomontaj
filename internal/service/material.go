package service

import (
	"go-hinomontaj/models"
	"go-hinomontaj/pkg/logger"
)

type MaterialService struct {
	repo Repository
}

func NewMaterialService(repo Repository) *MaterialService {
	return &MaterialService{repo: repo}
}

func (s *MaterialService) Create(material models.Material) error {
	logger.Debug("Создание нового материала в сервисе: %s", material.Name)
	return s.repo.AddMaterial(material)
}

func (s *MaterialService) GetAll() ([]models.Material, error) {
	logger.Debug("Получение списка всех материалов в сервисе")
	return s.repo.GetAllMaterials()
}

func (s *MaterialService) GetById(id int) (models.Material, error) {
	logger.Debug("Получение материала по ID в сервисе: %d", id)
	return s.repo.GetMaterialById(id)
}

func (s *MaterialService) GetByNameAndType(name string, typeDS int) (models.Material, error) {
	logger.Debug("Получение материала по названию и типу ДС в сервисе: %s (тип ДС: %d)", name, typeDS)
	return s.repo.GetMaterialByNameAndType(name, typeDS)
}

func (s *MaterialService) Update(id int, material models.Material) error {
	logger.Debug("Обновление материала в сервисе: %d", id)
	return s.repo.UpdateMaterial(id, material)
}

func (s *MaterialService) Delete(id int) error {
	logger.Debug("Удаление материала в сервисе: %d", id)
	return s.repo.DeleteMaterial(id)
}

func (s *MaterialService) AddQuantity(id int, quantity int) error {
	logger.Debug("Добавление количества %d к материалу ID: %d в сервисе", quantity, id)
	return s.repo.AddMaterialQuantity(id, quantity)
}

func (s *MaterialService) SubtractQuantity(id int, quantity int) error {
	logger.Debug("Уменьшение количества %d у материала ID: %d в сервисе", quantity, id)
	return s.repo.SubtractMaterialQuantity(id, quantity)
}
