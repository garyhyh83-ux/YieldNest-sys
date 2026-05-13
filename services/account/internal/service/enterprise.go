package service

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/yieldnest/account-service/internal/model"
	"github.com/yieldnest/account-service/internal/repository"
)

type EnterpriseService struct {
	enterpriseRepo *repository.EnterpriseRepo
	auditLogRepo   *repository.AuditLogRepo
}

func NewEnterpriseService(er *repository.EnterpriseRepo, ar *repository.AuditLogRepo) *EnterpriseService {
	return &EnterpriseService{enterpriseRepo: er, auditLogRepo: ar}
}

func (s *EnterpriseService) Create(ctx context.Context, legalName, country, entityType string, regNumber *string) (*model.Enterprise, error) {
	e := &model.Enterprise{
		ID:                 uuid.New().String(),
		LegalName:          legalName,
		RegistrationNumber: regNumber,
		Country:            country,
		EntityType:         entityType,
		KYBStatus:          "pending",
		RiskScore:          0,
	}
	if err := s.enterpriseRepo.Create(ctx, e); err != nil {
		return nil, err
	}
	s.logAudit(ctx, e.ID, nil, "enterprise.created", "enterprise", e.ID, nil)
	return e, nil
}

func (s *EnterpriseService) GetByID(ctx context.Context, id string) (*model.Enterprise, error) {
	return s.enterpriseRepo.FindByID(ctx, id)
}

func (s *EnterpriseService) List(ctx context.Context, limit, offset int) ([]model.Enterprise, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.enterpriseRepo.List(ctx, limit, offset)
}

func (s *EnterpriseService) UpdateKYBStatus(ctx context.Context, id, status, providerRef, actorID string) error {
	if err := s.enterpriseRepo.UpdateKYBStatus(ctx, id, status, providerRef); err != nil {
		return err
	}
	details, _ := json.Marshal(map[string]string{"newStatus": status})
	s.logAudit(ctx, id, &actorID, "enterprise.kyb_updated", "enterprise", id, details)
	return nil
}

func (s *EnterpriseService) logAudit(ctx context.Context, enterpriseID string, actorID *string, action, resType, resID string, details json.RawMessage) {
	if s.auditLogRepo == nil {
		return
	}
	log := &model.AuditLog{
		ID:           uuid.New().String(),
		EnterpriseID: &enterpriseID,
		ActorID:      actorID,
		Action:       action,
		ResourceType: &resType,
		ResourceID:   &resID,
		Details:      details,
	}
	_ = s.auditLogRepo.Create(ctx, log) // best-effort audit
}
