package service

import (
	"context"
	"log"

	"github.com/yieldnest/account-service/internal/model"
)

// NotificationService sends notifications for approval events.
// Phase 2: best-effort logging. Phase 3 integrates with SendGrid/SES/Webhooks.
type NotificationService struct{}

func NewNotificationService() *NotificationService {
	return &NotificationService{}
}

func (s *NotificationService) NotifyApprovalRequested(ctx context.Context, approval *model.Approval) {
	log.Printf("[NOTIFICATION] Approval requested: id=%s type=%s enterprise=%s quorum=%d/%d",
		approval.ID, approval.ApprovalType, approval.EnterpriseID,
		approval.CurrentQuorum, approval.RequiredQuorum)
}

func (s *NotificationService) NotifyVoteCast(ctx context.Context, approval *model.Approval, vote *model.ApprovalVote) {
	log.Printf("[NOTIFICATION] Vote cast on approval %s: voter=%s vote=%s status=%s",
		approval.ID, vote.VoterID, vote.Vote, approval.Status)
}

func (s *NotificationService) NotifyApprovalResolved(ctx context.Context, approval *model.Approval) {
	log.Printf("[NOTIFICATION] Approval resolved: id=%s status=%s",
		approval.ID, approval.Status)
}
