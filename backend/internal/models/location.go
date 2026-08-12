package models

type Province struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type LocationCity struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	ProvinceID   string `json:"provinceId"`
	ProvinceName string `json:"provinceName"`
}
