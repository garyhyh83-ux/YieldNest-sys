package service

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/yieldnest/account-service/internal/model"
	"github.com/yieldnest/account-service/internal/repository"
)

type MemberService struct {
	userRepo     *repository.UserRepo
	auditLogRepo *repository.AuditLogRepo
}

func NewMemberService(ur *repository.UserRepo, ar *repository.AuditLogRepo) *MemberService {
	return &MemberService{userRepo: ur, auditLogRepo: ar}
}

func (s *MemberService) Invite(ctx context.Context, enterpriseID, email, role, displayName, actorID string) (*model.User, error) {
	u := &model.User{
		ID:           uuid.New().String(),
		EnterpriseID: enterpriseID,
		Email:        email,
		DisplayName:  &displayName,
		Role:         role,
		Status:       "invited",
	}
	if err := s.userRepo.Create(ctx, u); err != nil {
		return nil, err
	}
	details, _ := json.Marshal(map[string]string{"email": email, "role": role})
	s.logAudit(ctx, enterpriseID, &actorID, "member.invited", "user", u.ID, details)
	return u, nil
}

func (s *MemberService) ListByEnterprise(ctx context.Context, enterpriseID string) ([]model.User, error) {
	return s.userRepo.ListByEnterprise(ctx, enterpriseID)
}

func (s *MemberService) UpdateRole(ctx context.Context, userID, enterpriseID, role, actorID string) error {
	if err := s.userRepo.UpdateRole(ctx, userID, role); err != nil {
		return err
	}
	details, _ := json.Marshal(map[string]string{"newRole": role})
	s.logAudit(ctx, enterpriseID, &actorID, "member.role_changed", "user", userID, details)
	return nil
}

func (s *MemberService) Remove(ctx context.Context, userID, enterpriseID, actorID string) error {
	if err := s.userRepo.SoftDelete(ctx, userID); err != nil {
		return err
	}
	s.logAudit(ctx, enterpriseID, &actorID, "member.removed", "user", userID, nil)
	return nil
}

func (s *MemberService) logAudit(ctx context.Context, enterpriseID string, actorID *string, action, resType, resID string, details json.RawMessage) {
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
	_ = s.auditLogRepo.Create(ctx, log)
}
