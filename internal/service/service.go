package service

import (
	"bytes"
	"go-hinomontaj/internal/repository/postgres"
	"go-hinomontaj/models"
	"time"

	"github.com/jmoiron/sqlx"
)

type DBConfig struct {
	DB *sqlx.DB
}

type Services struct {
	Auth     Auth
	Worker   Worker
	Client   Client
	Order    Order
	Service  Service
	Contract Contract
	Material Material
}

type ServicesConfig struct {
	Repository *postgres.Repository
	SigningKey string
}

func NewServices(cfg ServicesConfig) *Services {
	return &Services{
		Auth:     NewAuthService(cfg.Repository, cfg.SigningKey),
		Worker:   NewWorkerService(cfg.Repository),
		Client:   NewClientService(cfg.Repository),
		Order:    NewOrderService(cfg.Repository),
		Service:  NewServiceService(cfg.Repository),
		Contract: NewContractService(cfg.Repository),
		Material: NewMaterialService(cfg.Repository),
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
	GetStatistics(workerId int, start time.Time, end time.Time) (models.WorkerStatistics, error)
	AddBonus(bonus models.PenaltyOrBonus) error
	GetBonuses(workerID int) ([]models.PenaltyOrBonus, error)
	AddPenalty(penalty models.PenaltyOrBonus) error
	GetPenalties(workerID int) ([]models.PenaltyOrBonus, error)
	Salary(workerID int, start time.Time) (float64, error)
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
	WhooseCar(car string) ([]models.Client, error)

	// ONLINE DATE
	OnlineDate(date *models.OnlineDate) error
	GetOnlineDate() ([]models.OnlineDate, error)
	UpdateOnlineDate(date models.OnlineDate) error
}

type Order interface {
	Create(order models.Order) (int, error)
	GetAll() ([]models.Order, error)
	GetByWorkerId(workerId int) ([]models.Order, error)
	GetByWorkerIdAndDateRange(workerId int, start, end time.Time) ([]models.Order, error)
	Update(id int, order models.Order) error
	UpdateStatus(id int, status string) error
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
	AddServicesToContract(contractID int, services []models.Service) error
}

type Material interface {
	Create(material models.Material) error
	GetAll() ([]models.Material, error)
	GetById(id int) (models.Material, error)
	GetByNameAndType(name string, typeDS int) (models.Material, error)
	Update(id int, material models.Material) error
	Delete(id int) error
	AddQuantity(id int, quantity int) error
	SubtractQuantity(id int, quantity int) error
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
	WhooseCar(car string) ([]models.Client, error)

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
	AddServicesToContract(contractID int, services []models.Service) error

	// Materials
	AddMaterial(material models.Material) error
	GetAllMaterials() ([]models.Material, error)
	GetMaterialById(id int) (models.Material, error)
	GetMaterialByNameAndType(name string, typeDS int) (models.Material, error)
	UpdateMaterial(id int, material models.Material) error
	DeleteMaterial(id int) error
	AddMaterialQuantity(id int, quantity int) error
	SubtractMaterialQuantity(id int, quantity int) error

	// Orders
	CreateOrder(order models.Order) (int, error)
	GetAllOrders() ([]models.Order, error)
	GetOrdersByWorkerId(workerId int) ([]models.Order, error)
	GetOrdersByWorkerIdAndDateRange(workerId int, start, end time.Time) ([]models.Order, error)
	UpdateOrder(id int, order models.Order) error
	UpdateOrderStatus(id int, status string) error
	DeleteOrder(id int) error
	GetOrderStatistics() (models.Statistics, error)

	// OnlineDate
	OnlineDate(date *models.OnlineDate) error
	GetOnlineDate() ([]models.OnlineDate, error)
	UpdateOnlineDate(date models.OnlineDate) error

	// Economic
	AddPenalty(penalty models.PenaltyOrBonus) error
	AddBonus(penalty models.PenaltyOrBonus) error
	GetBonuses(workerID int) ([]models.PenaltyOrBonus, error)
	GetPenalties(workerID int) ([]models.PenaltyOrBonus, error)
	GetWorkerStatistic(workerID int, start, end time.Time) (models.WorkerStatistics, error)
}
