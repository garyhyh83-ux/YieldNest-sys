package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/yieldnest/account-service/internal/model"
	"github.com/yieldnest/account-service/internal/repository"
)

type ApprovalPolicyService struct {
	policyRepo   *repository.ApprovalPolicyRepo
	auditLogRepo *repository.AuditLogRepo
}

func NewApprovalPolicyService(pr *repository.ApprovalPolicyRepo, ar *repository.AuditLogRepo) *ApprovalPolicyService {
	return &ApprovalPolicyService{policyRepo: pr, auditLogRepo: ar}
}

func (s *ApprovalPolicyService) Create(ctx context.Context, enterpriseID, policyType, actorID string, rules json.RawMessage) (*model.ApprovalPolicy, error) {
	if !isValidPolicyType(policyType) {
		return nil, fmt.Errorf("invalid policy type: %s", policyType)
	}

	// Validate rules is valid JSON array
	var rulesArr []interface{}
	if err := json.Unmarshal(rules, &rulesArr); err != nil {
		return nil, fmt.Errorf("rules must be a JSON array")
	}

	p := &model.ApprovalPolicy{
		ID:           uuid.New().String(),
		EnterpriseID: enterpriseID,
		PolicyType:   policyType,
		Rules:        rules,
	}
	if err := s.policyRepo.Create(ctx, p); err != nil {
		return nil, err
	}

	details, _ := json.Marshal(map[string]string{"policyType": policyType})
	s.logAudit(ctx, enterpriseID, &actorID, "approval.policy_created", "approval_policy", p.ID, details)
	return p, nil
}

func (s *ApprovalPolicyService) Update(ctx context.Context, policyID, enterpriseID, actorID string, rules json.RawMessage) (*model.ApprovalPolicy, error) {
	p, err := s.policyRepo.FindByID(ctx, policyID)
	if err != nil {
		return nil, err
	}
	if p.EnterpriseID != enterpriseID {
		return nil, fmt.Errorf("policy not found")
	}

	var rulesArr []interface{}
	if err := json.Unmarshal(rules, &rulesArr); err != nil {
		return nil, fmt.Errorf("rules must be a JSON array")
	}

	p.Rules = rules
	if err := s.policyRepo.Update(ctx, p); err != nil {
		return nil, err
	}

	details, _ := json.Marshal(map[string]string{"policyType": p.PolicyType})
	s.logAudit(ctx, enterpriseID, &actorID, "approval.policy_updated", "approval_policy", policyID, details)
	return p, nil
}

func (s *ApprovalPolicyService) Delete(ctx context.Context, policyID, enterpriseID, actorID string) error {
	p, err := s.policyRepo.FindByID(ctx, policyID)
	if err != nil {
		return err
	}
	if p.EnterpriseID != enterpriseID {
		return fmt.Errorf("policy not found")
	}
	return s.policyRepo.Delete(ctx, policyID)
}

func (s *ApprovalPolicyService) List(ctx context.Context, enterpriseID string) ([]model.ApprovalPolicy, error) {
	return s.policyRepo.FindByEnterpriseID(ctx, enterpriseID)
}

// ApprovalRequirement describes whether and how an action requires approval.
type ApprovalRequirement struct {
	ApprovalRequired   bool     `json:"approvalRequired"`
	Quorum             int      `json:"quorum"`
	EligibleApprovers  []string `json:"eligibleApprovers"`
	RequiredApprovers  []string `json:"requiredApprovers,omitempty"`
}

// PolicyRule mirrors the JSONB rule structure for deserialization.
type PolicyRule struct {
	Condition          string   `json:"condition"`
	ApprovalType       string   `json:"approvalType"`
	Quorum             int      `json:"quorum"`
	EligibleApprovers  []string `json:"eligibleApprovers"`
	RequiredApprovers  []string `json:"requiredApprovers,omitempty"`
}

// EvaluateAndRequireApproval determines if an action needs approval and returns the requirements.
// The amount string is used to evaluate rules that compare against an "amount" field.
func (s *ApprovalPolicyService) EvaluateAndRequireApproval(ctx context.Context, enterpriseID, policyType, amount string) (*ApprovalRequirement, error) {
	policy, err := s.policyRepo.FindByEnterpriseAndType(ctx, enterpriseID, policyType)
	if err != nil {
		return nil, err
	}
	if policy == nil {
		// No policy configured — auto-approve
		return &ApprovalRequirement{ApprovalRequired: false}, nil
	}

	var rules []PolicyRule
	if err := json.Unmarshal(policy.Rules, &rules); err != nil {
		return nil, fmt.Errorf("invalid policy rules: %w", err)
	}

	for _, rule := range rules {
		matched, err := evaluateCondition(rule.Condition, amount)
		if err != nil {
			continue // skip unparseable conditions
		}
		if matched {
			if rule.ApprovalType == "auto" {
				return &ApprovalRequirement{ApprovalRequired: false}, nil
			}
			return &ApprovalRequirement{
				ApprovalRequired:  true,
				Quorum:            rule.Quorum,
				EligibleApprovers: rule.EligibleApprovers,
				RequiredApprovers: rule.RequiredApprovers,
			}, nil
		}
	}

	// No rule matched — default to requiring approval as a safety measure
	return &ApprovalRequirement{
		ApprovalRequired:  true,
		Quorum:            1,
		EligibleApprovers: []string{"role:admin"},
	}, nil
}

// evaluateCondition evaluates a simple condition string against a numeric value.
// Supports: "amount <= N", "amount > N", "amount > N AND amount <= M", where N is float64.
func evaluateCondition(condition, amountStr string) (bool, error) {
	// Parse condition as JSON to extract numeric comparison
	// The seed data format is: "amount > 10000 AND amount <= 100000"
	// We implement a simple evaluator for these patterns.
	amount := parseNumeric(amountStr)

	// Try compound AND
	var parts []string
	if len(condition) > 4 && condition[:3] == "amount" {
		// Split by AND
		parts = splitAnd(condition)
	}

	if len(parts) == 0 {
		parts = []string{condition}
	}

	for _, part := range parts {
		part = trim(part)
		if part == "" {
			continue
		}
		if !evalSingleCondition(part, amount) {
			return false, nil
		}
	}
	return len(parts) > 0, nil
}

func evalSingleCondition(cond string, amount float64) bool {
	if len(cond) >= 8 && cond[:6] == "amount" {
		rest := trim(cond[6:])
		if len(rest) >= 2 && rest[:2] == "<=" {
			val := parseNumeric(trim(rest[2:]))
			return amount <= val
		}
		if rest[0] == '>' {
			rest = trim(rest[1:])
			if len(rest) > 0 && rest[0] == '=' {
				val := parseNumeric(trim(rest[1:]))
				return amount >= val
			}
			val := parseNumeric(rest)
			return amount > val
		}
		if rest[0] == '<' {
			val := parseNumeric(trim(rest[1:]))
			return amount < val
		}
		if len(rest) >= 2 && rest[:2] == "==" {
			val := parseNumeric(trim(rest[2:]))
			return amount == val
		}
	}
	return false
}

func parseNumeric(s string) float64 {
	var f float64
	fmt.Sscanf(s, "%f", &f)
	return f
}

func splitAnd(s string) []string {
	var parts []string
	start := 0
	for i := 0; i < len(s); i++ {
		if i+4 < len(s) && s[i:i+5] == " AND " {
			parts = append(parts, s[start:i])
			start = i + 5
			i = start - 1
		}
	}
	parts = append(parts, s[start:])
	return parts
}

func trim(s string) string {
	for len(s) > 0 && s[0] == ' ' {
		s = s[1:]
	}
	for len(s) > 0 && s[len(s)-1] == ' ' {
		s = s[:len(s)-1]
	}
	return s
}

func isValidPolicyType(t string) bool {
	switch t {
	case "withdrawal", "whitelist_change", "role_change", "strategy_change", "account_recovery":
		return true
	}
	return false
}

func (s *ApprovalPolicyService) logAudit(ctx context.Context, enterpriseID string, actorID *string, action, resType, resID string, details json.RawMessage) {
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
