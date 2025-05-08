package models

import (
	"time"

	"github.com/lib/pq"
)

type User struct {
	ID   int    `json:"id" db:"id"`
	Name string `json:"name" db:"name"`

	Email    string `json:"email" db:"email"`
	Password string `json:"password" db:"password_hash"`
	Role     string `json:"role" db:"role"`
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
	ID         int       `json:"id" db:"id"`
	Name       string    `json:"name" db:"name"`
	ClientType string    `json:"client_type" db:"client_type"`
	Price      int       `json:"price" db:"price"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

type Worker struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Surname   string    `json:"surname" db:"surname"`
	Salary    float64   `json:"salary" db:"salary"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
	Email     string    `json:"email" db:"-"`
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
