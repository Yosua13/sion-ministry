package repository

import (
	"backend/internal/models"
	"gorm.io/gorm"
)

type ModuleRepository interface {
	GetAll() ([]models.DiscipleshipModule, error)
	GetByID(id string) (*models.DiscipleshipModule, error)
	Update(module *models.DiscipleshipModule) error
}

type moduleRepository struct {
	db *gorm.DB
}

func NewModuleRepository(db *gorm.DB) ModuleRepository {
	return &moduleRepository{db: db}
}

func (r *moduleRepository) GetAll() ([]models.DiscipleshipModule, error) {
	var modules []models.DiscipleshipModule
	err := r.db.Find(&modules).Error
	return modules, err
}

func (r *moduleRepository) GetByID(id string) (*models.DiscipleshipModule, error) {
	var module models.DiscipleshipModule
	err := r.db.First(&module, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &module, nil
}

func (r *moduleRepository) Update(module *models.DiscipleshipModule) error {
	return r.db.Save(module).Error
}
