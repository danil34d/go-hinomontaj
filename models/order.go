package models

import "time"

type Order struct {
	ID            int            `json:"id"`
	VehicleNumber string         `json:"vehicle_number"`
	PaymentMethod string         `json:"payment_method"`
	ClientType    string         `json:"client_type"`
	CreatedAt     time.Time      `json:"created_at"`
	Services      []OrderService `json:"services"`
}

type OrderService struct {
	ID            int    `json:"id"`
	OrderID       int    `json:"order_id"`
	ServiceID     int    `json:"service_id"`
	ServiceName   string `json:"service_name"`
	WheelPosition string `json:"wheel_position"`
}
