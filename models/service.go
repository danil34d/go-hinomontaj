package models

type Service struct {
	ID              int     `json:"id"`
	Name            string  `json:"name"`
	PriceIndividual float64 `json:"price_individual"`
	PriceCompany    float64 `json:"price_company"`
}
