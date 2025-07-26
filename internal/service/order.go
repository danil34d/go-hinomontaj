package service

import "go-hinomontaj/models"

type OrderService interface {
	Create(order models.Order) (int, error)
	GetAll() ([]models.Order, error)
	GetByWorkerId(workerId int) ([]models.Order, error)
	Update(id int, order models.Order) error
	Delete(id int) error
	GetStatistics() (models.Statistics, error)
}

type OrderServiceImpl struct {
	repo Repository
}

func NewOrderService(repo Repository) *OrderServiceImpl {
	return &OrderServiceImpl{
		repo: repo,
	}
}

func (s *OrderServiceImpl) Create(order models.Order) (int, error) {
	return s.repo.CreateOrder(order)
}

func (s *OrderServiceImpl) GetAll() ([]models.Order, error) {
	return s.repo.GetAllOrders()
}

func (s *OrderServiceImpl) GetByWorkerId(workerId int) ([]models.Order, error) {
	return s.repo.GetOrdersByWorkerId(workerId)
}

func (s *OrderServiceImpl) Update(id int, order models.Order) error {
	return s.repo.UpdateOrder(id, order)
}

func (s *OrderServiceImpl) Delete(id int) error {
	return s.repo.DeleteOrder(id)
}

//func (s *OrderServiceImpl) GetStatistics() (models.Statistics, error) {
//	return s.repo.GetOrderStatistics()
//}
