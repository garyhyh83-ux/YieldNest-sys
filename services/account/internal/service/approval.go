package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yieldnest/account-service/internal/model"
	"github.com/yieldnest/account-service/internal/repository"
)

type ApprovalService struct {
	approvalRepo *repository.ApprovalRepo
	policySvc    *ApprovalPolicyService
	auditLogRepo *repository.AuditLogRepo
	notifier     *NotificationService
}

func NewApprovalService(
	ar *repository.ApprovalRepo,
	ps *ApprovalPolicyService,
	alr *repository.AuditLogRepo,
	ns *NotificationService,
) *ApprovalService {
	return &ApprovalService{
		approvalRepo: ar,
		policySvc:    ps,
		auditLogRepo: alr,
		notifier:     ns,
	}
}

// RequestApproval creates a new approval request if the policy requires it.
// Returns the approval (or nil if auto-approved) and whether approval is required.
func (s *ApprovalService) RequestApproval(
	ctx context.Context,
	enterpriseID, approvalType, requesterID string,
	payload json.RawMessage,
	idempotencyKey *string,
	amount string,
) (*model.Approval, bool, error) {
	// Evaluate policy
	requirement, err := s.policySvc.EvaluateAndRequireApproval(ctx, enterpriseID, approvalType, amount)
	if err != nil {
		return nil, false, err
	}
	if !requirement.ApprovalRequired {
		return nil, false, nil
	}

	// Include eligible approvers in the payload for later lookup
	enrichedPayload, _ := json.Marshal(map[string]interface{}{
		"payload":           json.RawMessage(payload),
		"eligibleApprovers": requirement.EligibleApprovers,
		"requiredApprovers": requirement.RequiredApprovers,
	})

	expiresAt := time.Now().Add(24 * time.Hour)
	a := &model.Approval{
		ID:             uuid.New().String(),
		EnterpriseID:   enterpriseID,
		ApprovalType:   approvalType,
		RequestedBy:    requesterID,
		Status:         "pending",
		RequiredQuorum: requirement.Quorum,
		CurrentQuorum:  0,
		Payload:        enrichedPayload,
		IdempotencyKey: idempotencyKey,
		ExpiresAt:      &expiresAt,
	}

	if err := s.approvalRepo.Create(ctx, a); err != nil {
		// Check for duplicate idempotency key
		if idempotencyKey != nil {
			return nil, false, fmt.Errorf("duplicate request: %w", err)
		}
		return nil, false, err
	}

	details, _ := json.Marshal(map[string]string{
		"approvalType": approvalType,
		"quorum":       fmt.Sprintf("%d", requirement.Quorum),
	})
	s.logAudit(ctx, enterpriseID, &requesterID, "approval.requested", "approval", a.ID, details)

	// Notify eligible approvers (non-blocking)
	if s.notifier != nil {
		go s.notifier.NotifyApprovalRequested(context.Background(), a)
	}

	return a, true, nil
}

// SubmitVote records a vote on an approval. If quorum is met, auto-resolves to "approved".
// If a required approver rejects, auto-resolves to "rejected".
func (s *ApprovalService) SubmitVote(
	ctx context.Context,
	approvalID, enterpriseID, voterID, voterRole, vote, comment string,
) (*model.Approval, error) {
	a, err := s.approvalRepo.FindByID(ctx, approvalID)
	if err != nil {
		return nil, err
	}
	if a.EnterpriseID != enterpriseID {
		return nil, fmt.Errorf("approval not found")
	}
	if a.Status != "pending" && a.Status != "in_progress" {
		return nil, fmt.Errorf("approval is already %s", a.Status)
	}
	if a.ExpiresAt != nil && time.Now().After(*a.ExpiresAt) {
		return nil, fmt.Errorf("approval has expired")
	}

	// Check user hasn't already voted
	hasVoted, err := s.approvalRepo.HasVoted(ctx, approvalID, voterID)
	if err != nil {
		return nil, err
	}
	if hasVoted {
		return nil, fmt.Errorf("already voted on this approval")
	}

	// Check user is an eligible approver
	if !s.isEligibleApprover(a.Payload, voterRole) {
		return nil, fmt.Errorf("not an eligible approver for this request")
	}

	v := &model.ApprovalVote{
		ID:         uuid.New().String(),
		ApprovalID: approvalID,
		VoterID:    voterID,
		Vote:       vote,
	}
	if comment != "" {
		v.Comment = &comment
	}

	if err := s.approvalRepo.AddVote(ctx, v); err != nil {
		return nil, err
	}

	// Update approval status based on the vote
	if vote == "reject" && s.isRequiredApprover(a.Payload, voterRole) {
		// Required approver rejection — immediate resolve
		now := time.Now()
		if err := s.approvalRepo.UpdateStatus(ctx, approvalID, "rejected", &now); err != nil {
			return nil, err
		}
		a.Status = "rejected"
		a.ResolvedAt = &now

		details, _ := json.Marshal(map[string]string{"vote": "reject", "byRequired": "true"})
		s.logAudit(ctx, enterpriseID, &voterID, "approval.resolved", "approval", approvalID, details)
	} else if vote == "approve" {
		// Count approve votes and check quorum
		votes, _ := s.approvalRepo.GetVotes(ctx, approvalID)
		approveCount := 0
		for _, vt := range votes {
			if vt.Vote == "approve" {
				approveCount++
			}
		}

		if approveCount >= a.RequiredQuorum {
			now := time.Now()
			if err := s.approvalRepo.UpdateStatus(ctx, approvalID, "approved", &now); err != nil {
				return nil, err
			}
			a.Status = "approved"
			a.ResolvedAt = &now

			details, _ := json.Marshal(map[string]string{"quorumMet": fmt.Sprintf("%d/%d", approveCount, a.RequiredQuorum)})
			s.logAudit(ctx, enterpriseID, nil, "approval.resolved", "approval", approvalID, details)
		} else {
			// Transition to in_progress if still pending
			if a.Status == "pending" {
				_ = s.approvalRepo.UpdateStatus(ctx, approvalID, "in_progress", nil)
				a.Status = "in_progress"
			}
			_ = s.approvalRepo.UpdateQuorum(ctx, approvalID, approveCount, nil)
			a.CurrentQuorum = approveCount
		}
	}

	// Log the vote
	voteDetails, _ := json.Marshal(map[string]string{"vote": vote})
	s.logAudit(ctx, enterpriseID, &voterID, "approval.voted", "approval", approvalID, voteDetails)

	// Notify requester (non-blocking)
	if s.notifier != nil {
		go s.notifier.NotifyVoteCast(context.Background(), a, v)
	}

	// Reload to get final state
	return s.approvalRepo.FindByID(ctx, approvalID)
}

// CancelApproval cancels a pending or in-progress approval.
func (s *ApprovalService) CancelApproval(ctx context.Context, approvalID, enterpriseID, actorID string) error {
	a, err := s.approvalRepo.FindByID(ctx, approvalID)
	if err != nil {
		return err
	}
	if a.EnterpriseID != enterpriseID {
		return fmt.Errorf("approval not found")
	}
	if a.Status != "pending" && a.Status != "in_progress" {
		return fmt.Errorf("cannot cancel approval with status %s", a.Status)
	}

	now := time.Now()
	if err := s.approvalRepo.UpdateStatus(ctx, approvalID, "cancelled", &now); err != nil {
		return err
	}

	s.logAudit(ctx, enterpriseID, &actorID, "approval.cancelled", "approval", approvalID, nil)
	return nil
}

// GetApproval returns an approval with its votes.
func (s *ApprovalService) GetApproval(ctx context.Context, approvalID, enterpriseID string) (*model.Approval, []model.ApprovalVote, error) {
	a, votes, err := s.approvalRepo.FindByIDWithVotes(ctx, approvalID)
	if err != nil {
		return nil, nil, err
	}
	if a.EnterpriseID != enterpriseID {
		return nil, nil, fmt.Errorf("approval not found")
	}
	return a, votes, nil
}

// ListApprovals returns paginated approvals for an enterprise.
func (s *ApprovalService) ListApprovals(ctx context.Context, enterpriseID, status, approvalType string, limit, offset int) ([]model.Approval, int, error) {
	if limit <= 0 {
		limit = 20
	}
	filter := repository.ApprovalFilter{
		EnterpriseID: enterpriseID,
		Status:       status,
		ApprovalType: approvalType,
		Limit:        limit,
		Offset:       offset,
	}
	approvals, err := s.approvalRepo.FindByEnterpriseID(ctx, filter)
	if err != nil {
		return nil, 0, err
	}
	count, err := s.approvalRepo.CountByEnterpriseID(ctx, filter)
	if err != nil {
		return approvals, 0, err
	}
	return approvals, count, nil
}

// ListPendingForApprover returns approvals awaiting the given user's vote.
func (s *ApprovalService) ListPendingForApprover(ctx context.Context, enterpriseID, voterID, userRole string, limit, offset int) ([]model.Approval, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.approvalRepo.FindPendingForApprover(ctx, enterpriseID, voterID, userRole, limit, offset)
}

// CheckTimeout expires stale pending/in_progress approvals.
func (s *ApprovalService) CheckTimeout(ctx context.Context) (int, error) {
	expired, err := s.approvalRepo.FindExpiredPending(ctx)
	if err != nil {
		return 0, err
	}
	now := time.Now()
	count := 0
	for _, a := range expired {
		if err := s.approvalRepo.UpdateStatus(ctx, a.ID, "expired", &now); err != nil {
			continue
		}
		count++
		s.logAudit(ctx, a.EnterpriseID, nil, "approval.expired", "approval", a.ID, nil)
	}
	return count, nil
}

func (s *ApprovalService) isEligibleApprover(payload json.RawMessage, userRole string) bool {
	var data map[string]interface{}
	if err := json.Unmarshal(payload, &data); err != nil {
		return false
	}
	approvers, ok := data["eligibleApprovers"].([]interface{})
	if !ok {
		return false
	}
	roleKey := "role:" + userRole
	for _, a := range approvers {
		if s, ok := a.(string); ok && s == roleKey {
			return true
		}
	}
	return false
}

func (s *ApprovalService) isRequiredApprover(payload json.RawMessage, userRole string) bool {
	var data map[string]interface{}
	if err := json.Unmarshal(payload, &data); err != nil {
		return false
	}
	approvers, ok := data["requiredApprovers"].([]interface{})
	if !ok {
		return false
	}
	roleKey := "role:" + userRole
	for _, a := range approvers {
		if s, ok := a.(string); ok && s == roleKey {
			return true
		}
	}
	return false
}

func (s *ApprovalService) logAudit(ctx context.Context, enterpriseID string, actorID *string, action, resType, resID string, details json.RawMessage) {
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
