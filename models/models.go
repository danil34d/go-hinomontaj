package models

import (
	"time"

	"github.com/lib/pq"
)

type User struct {
	ID       int    `json:"id" db:"id"`
	Name     string `json:"name" db:"name"`
	Email    string `json:"email" db:"email"`
	Password string `json:"-" db:"password_hash"`
	Role     string `json:"role" db:"role"`
	WorkerID int    `json:"worker_id" db:"-"`
}

type SignInInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type SignUpInput struct {
	Name     string `json:"name" binding:"required,min=2"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required,oneof=worker manager"`
}

type Client struct {
	ID         int            `json:"id" db:"id"`
	Name       string         `json:"name" db:"name"`
	ClientType string         `json:"client_type" db:"client_type"` // если == имени то цены индивидуальные
	Cars       []Car          `json:"cars"`
	OwnerPhone string         `json:"owner_phone" db:"owner_phone"`
	ManagerPhone string         `json:"manager_phone" db:"manager_phone"`
	ContractID int            `json:"contract_id" db:"contract_id"`
	CarNumbers pq.StringArray `json:"car_numbers" db:"car_numbers"`
	CreatedAt  time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at" db:"updated_at"`
}

type ClientsCars struct {
	ClientID int `json:"client_id" db:"client_id"`
	CarID    int `json:"car_id" db:"car_id"`
}

type Car struct {
	ID        int       `json:"id" db:"id"`
	Number    string    `json:"number" db:"number"`
	Model     string    `json:"model" db:"model"`
	Year      int       `json:"year" db:"year"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type Order struct {
	ID            int            `json:"id" db:"id"`
	WorkerID      int            `json:"worker_id" db:"worker_id"`
	ClientID      int            `json:"client_id" db:"client_id"`
	Client        *Client        `json:"client" db:"-"`
	VehicleNumber string         `json:"vehicle_number" db:"vehicle_number"`
	PaymentMethod string         `json:"payment_method" db:"payment_method"`
	TotalAmount   float64        `json:"total_amount" db:"total_amount"`
	CreatedAt     time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at" db:"updated_at"`
	Services      []OrderService `json:"services"`
}

// связующая таблица для бд
type OrderService struct {
	ID            int       `json:"id" db:"id"`
	OrderID       int       `json:"order_id" db:"order_id"`
	ServiceID     int       `json:"service_id" db:"service_id"`
	Description   string    `json:"service_description" db:"service_description"`
	WheelPosition string    `json:"wheel_position" db:"wheel_position"`
	Price         float64   `json:"price" db:"price"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// Услуга и её прайс для определённого типа клиента
type Service struct {
	ID             int       `json:"id" db:"id"`
	Name           string    `json:"name" db:"name"`
	Price          int       `json:"price" db:"price"`
	ContractID     int       `json:"contract_id" db:"contract_id"`
	MaterialCardId int       `json:"material_card" db:"material_card"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

type Compare struct{
	CompanyName string
	ServiceName string
	Price int
}

// Contract представляет договор с клиентом
type Contract struct {
	ID         int       `json:"id" db:"id"`
	Number     string    `json:"number" db:"number"`
	Description string    `json:"description" db:"description"`
	
	ClientCompanyName string    `json:"client_company_name" db:"client_company_name"`
	ClientCompanyAddress string    `json:"client_company_address" db:"client_company_address"`
	ClientCompanyPhone string    `json:"client_company_phone" db:"client_company_phone"`
	ClientCompanyEmail string    `json:"client_company_email" db:"client_company_email"`
	ClientCompanyINN string    `json:"client_company_inn" db:"client_company_inn"`
	ClientCompanyKPP string    `json:"client_company_kpp" db:"client_company_kpp"`
	ClientCompanyOGRN string    `json:"client_company_ogrn" db:"client_company_ogrn"`
	
	ClientType string    `json:"client_type" db:"client_type"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

type ServicePrice struct {
	ID         int       `json:"id" db:"id"`
	ContractID int       `json:"contract_id" db:"contract_id"`
	ContractName string    `json:"contract_name" db:"contract_name"`
	ServiceName  string    `json:"service_name" db:"service_name"`
	MaterialCardID int       `json:"material_card_id" db:"material_card_id"`
	Price      int       `json:"price" db:"price"`
}

// ServiceWithPrices представляет услугу с ценами по всем договорам
type ServiceWithPrices struct {
	Name         string    `json:"name"`
	MaterialCard int       `json:"material_card"`
	Prices       []struct {
		ContractID   int    `json:"contract_id"`
		ContractName string `json:"contract_name"`
		Price        int    `json:"price"`
	} `json:"prices"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type MaterialCard struct {
	ID         int       `json:"id" db:"id"`
	Rs25       int       `json:"rs25" db:"Rs25"`
	R19        int       `json:"r19" db:"R19"`
	R20        int       `json:"r20" db:"R20"`
	R25        int       `json:"r25" db:"R25"`
	R251       int       `json:"r251" db:"R251"`
	R13        int       `json:"r13" db:"R13"`
	R15        int       `json:"r15" db:"R15"`
	Foot9      int       `json:"foot9" db:"Foot9"`
	Foot12     int       `json:"foot12" db:"Foot12"`
	Foot15     int       `json:"foot15" db:"Foot15"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

type Storage struct {
	ID         int       `json:"id" db:"id"`
	Rs25       int       `json:"rs25" db:"Rs25"`
	R19        int       `json:"r19" db:"R19"`
	R20        int       `json:"r20" db:"R20"`
	R25        int       `json:"r25" db:"R25"`
	R251       int       `json:"r251" db:"R251"`
	R13        int       `json:"r13" db:"R13"`
	R15        int       `json:"r15" db:"R15"`
	Foot9      int       `json:"foot9" db:"Foot9"`
	Foot12     int       `json:"foot12" db:"Foot12"`
	Foot15     int       `json:"foot15" db:"Foot15"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

type Worker struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Surname   string    `json:"surname" db:"surname"`
	Email     string    `json:"email" db:"email"`
	Phone     string    `json:"phone" db:"phone"`
	SalarySchema string `json:"salary_schema" db:"salary_schema"`
	Salary       int    `json:"salary" db:"salary"`
	HasCar       bool   `json:"has_car" db:"has_car"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
	Password  string    `json:"password" db:"-"`
	Role      string    `json:"role" db:"-"`
}

type Statistics struct {
	TotalOrders       int     `json:"total_orders"`
	TotalRevenue      float64 `json:"total_revenue"`
	TotalWorkers      int     `json:"total_workers"`
	TotalClients      int     `json:"total_clients"`
	AverageOrderValue float64 `json:"average_order_value"`
}

type WorkerStatistics struct {
	WorkerID      int    `json:"worker_id" db:"worker_id"`
	WorkerName    string `json:"worker_name" db:"worker_name"`
	WorkerSurname string `json:"worker_surname" db:"worker_surname"`
	WorkerPhone   string `json:"worker_phone" db:"worker_phone"`
	SalarySchema  string `json:"salary_schema" db:"salary_schema"`

	TotalOrders    int `json:"total_orders" db:"total_orders"`
	TotalRevenue   int `json:"total_revenue" db:"total_revenue"`
	TotalBonus     int `json:"total_bonus" db:"total_bonus"`
	TotalPenalties int `json:"total_penalties" db:"total_penalties"`
	TotalSalary    int `json:"total_salary" db:"total_salary"`
}

type PenaltyOrBonus struct {
	ID         int       `json:"id" db:"id"`
	WorkerID   int       `json:"worker_id" db:"workerID"`
	Desc       string    `json:"description" db:"description"`
	Amount     int       `json:"delta" db:"delta"`
	OrderID    int       `json:"order_id" db:"order_id"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type OnlineDate struct {
	ID         int       `json:"id" db:"id"`
	Date		time.Time `json:"date" db:"date"`
	Name 		string `json:"name" db:"name"`
	Phone 		string `json:"phone" db:"phone"`
	CarNumber	string `json:"car_number" db:"car_number"`
	ClientDesc string `json:"client_desc" db:"client_desc"`
	ManagerDesc string `json:"manager_desc" db:"manager_desc"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}