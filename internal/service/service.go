package service

import (
	"bytes"
	"go-hinomontaj/internal/repository/postgres"
	"go-hinomontaj/models"

	"github.com/jmoiron/sqlx"
)

type DBConfig struct {
	DB *sqlx.DB
}

type Services struct {
	Auth         Auth
	Worker       Worker
	Client       Client
	Order        Order
	Service      Service
	Contract     Contract
	MaterialCard MaterialCard
}

type ServicesConfig struct {
	Repository *postgres.Repository
	SigningKey string
}

func NewServices(cfg ServicesConfig) *Services {
	return &Services{
		Auth:         NewAuthService(cfg.Repository, cfg.SigningKey),
		Worker:       NewWorkerService(cfg.Repository),
		Client:       NewClientService(cfg.Repository),
		Order:        NewOrderService(cfg.Repository),
		Service:      NewServiceService(cfg.Repository),
		Contract:     NewContractService(cfg.Repository),
		MaterialCard: NewMaterialCardService(cfg.Repository),
	}
}

type Auth interface {
	Login(input models.SignInInput) (string, models.User, error)
	Register(input models.SignUpInput) (string, models.User, error)
}

type Worker interface {
	Create(worker models.Worker) (int, error)
	GetAll() ([]models.Worker, error)
	GetById(id int) (models.Worker, error)
	Update(id int, worker models.Worker) error
	Delete(id int) error
	GetByUserId(userId int) (models.Worker, error)
	GetStatistics(workerId int) (models.WorkerStatistics, error)
}

type Client interface {
	Create(client models.Client) (int, error)
	GetAll() ([]models.Client, error)
	GetById(id int) (models.Client, error)
	Update(id int, client models.Client) error
	Delete(id int) error
	GetClientCars(clientId int) ([]models.Car, error)
	AddCarToClient(clientId int, car models.Car) error
	GetTypes() ([]string, error)
	UploadCarsFromExcel(clientId int, fileData []byte) error
	GetCarsTemplate() (*bytes.Buffer, error)
}

type Order interface {
	Create(order models.Order) (int, error)
	GetAll() ([]models.Order, error)
	GetByWorkerId(workerId int) ([]models.Order, error)
	Update(id int, order models.Order) error
	Delete(id int) error
	GetStatistics() (models.Statistics, error)
}

type Service interface {
	Create(service models.Service) (int, error)
	GetAll() ([]models.Service, error)
	GetAllWithPrices() ([]models.ServiceWithPrices, error)
	Update(id int, service models.Service) error
	Delete(id int) error
	GetServicePricesByContract(contractID int) ([]models.Service, error)
}

type Contract interface {
	Create(contract models.Contract) (int, error)
	GetAll() ([]models.Contract, error)
	Update(id int, contract models.Contract) error
	Delete(id int) error
}

type MaterialCard interface {
	Create(materialCard models.MaterialCard) (int, error)
	GetAll() ([]models.MaterialCard, error)
	Update(id int, materialCard models.MaterialCard) error
	Delete(id int) error
	GetStorage() (models.Storage, error)
	AddDelivery(delivery models.Storage) error
}

type Repository interface {
	// Users
	CreateUser(user models.User) (int, error)
	GetUser(email string) (models.User, error)
	GetUserById(id int) (models.User, error)

	// Workers
	CreateWorker(worker models.Worker) (int, error) // с аккаунта админа
	GetAllWorkers() ([]models.Worker, error)
	GetWorkerByName(name string) (models.Worker, error)
	GetWorkerById(id int) (models.Worker, error)
	GetWorkerByUserId(userId int) (models.Worker, error)
	GetWorkerStatistics(workerId int) (models.WorkerStatistics, error)
	UpdateWorker(id int, worker models.Worker) error
	DeleteWorker(id int) error

	// Clients
	CreateClient(client models.Client) (int, error)
	GetAllClients() ([]models.Client, error)
	GetClientById(id int) (models.Client, error)
	GetClientCars(clientId int) ([]models.Car, error)
	AddCarToClient(clientId int, car models.Car) error
	UpdateClient(id int, client models.Client) error
	DeleteClient(id int) error
	GetClientTypes() ([]string, error)
	CarExists(number string) (bool, error)

	//Services
	CreateService(service models.Service) (int, error)
	GetAllServices() ([]models.Service, error)
	GetAllWithPrices() ([]models.ServiceWithPrices, error)
	UpdateService(id int, service models.Service) error
	DeleteService(id int) error
	GetServicePricesByContract(contractID int) ([]models.Service, error)

	// Contracts
	CreateContract(contract models.Contract) (int, error)
	GetAllContracts() ([]models.Contract, error)
	UpdateContract(id int, contract models.Contract) error
	DeleteContract(id int) error

	// MaterialCards
	CreateMaterialCard(materialCard models.MaterialCard) (int, error)
	GetAllMaterialCards() ([]models.MaterialCard, error)
	UpdateMaterialCard(id int, materialCard models.MaterialCard) error
	DeleteMaterialCard(id int) error
	GetStorage() (models.Storage, error)
	AddDelivery(delivery models.Storage) error

	// Orders
	CreateOrder(order models.Order) (int, error)
	GetAllOrders() ([]models.Order, error)
	GetOrdersByWorkerId(workerId int) ([]models.Order, error)
	UpdateOrder(id int, order models.Order) error
	DeleteOrder(id int) error
	GetOrderStatistics() (models.Statistics, error)
}
