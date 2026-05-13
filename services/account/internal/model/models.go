package model

import (
	"encoding/json"
	"time"
)

type Enterprise struct {
	ID                 string          `json:"id"`
	LegalName          string          `json:"legalName"`
	RegistrationNumber *string         `json:"registrationNumber"`
	Country            string          `json:"country"`
	EntityType         string          `json:"entityType"`
	KYBStatus          string          `json:"kybStatus"`
	KYBProviderRef     *string         `json:"kybProviderRef"`
	RiskScore          int             `json:"riskScore"`
	CreatedAt          time.Time       `json:"createdAt"`
	UpdatedAt          time.Time       `json:"updatedAt"`
}

type User struct {
	ID              string          `json:"id"`
	EnterpriseID    string          `json:"enterpriseId"`
	Email           string          `json:"email"`
	DisplayName     *string         `json:"displayName"`
	Role            string          `json:"role"`
	AuthFactors     json.RawMessage `json:"authFactors"`
	Status          string          `json:"status"`
	LastLoginAt     *time.Time      `json:"lastLoginAt"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
}

type SmartAccount struct {
	ID             string          `json:"id"`
	EnterpriseID   string          `json:"enterpriseId"`
	ChainID        int             `json:"chainId"`
	AccountAddress string          `json:"accountAddress"`
	SafeVersion    *string         `json:"safeVersion"`
	Owners         json.RawMessage `json:"owners"`
	Threshold      int             `json:"threshold"`
	FactorySalt    *string         `json:"factorySalt"`
	DeployedAt     *time.Time      `json:"deployedAt"`
	CreatedAt      time.Time       `json:"createdAt"`
}

type WhitelistAddress struct {
	ID           string    `json:"id"`
	EnterpriseID string    `json:"enterpriseId"`
	Address      string    `json:"address"`
	Label        *string   `json:"label"`
	AddedBy      string    `json:"addedBy"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"createdAt"`
}

type Transaction struct {
	ID              string          `json:"id"`
	EnterpriseID    string          `json:"enterpriseId"`
	SmartAccountID  *string         `json:"smartAccountId"`
	TxType          string          `json:"txType"`
	Asset           string          `json:"asset"`
	Amount          string          `json:"amount"`
	Direction       string          `json:"direction"`
	Status          string          `json:"status"`
	ChainTxHash     *string         `json:"chainTxHash"`
	UserOpHash      *string         `json:"userOpHash"`
	ApprovalID      *string         `json:"approvalId"`
	IdempotencyKey  *string         `json:"idempotencyKey"`
	Metadata        json.RawMessage `json:"metadata"`
	CreatedAt       time.Time       `json:"createdAt"`
	ConfirmedAt     *time.Time      `json:"confirmedAt"`
}

type ApprovalPolicy struct {
	ID           string          `json:"id"`
	EnterpriseID string          `json:"enterpriseId"`
	PolicyType   string          `json:"policyType"`
	Rules        json.RawMessage `json:"rules"`
	CreatedAt    time.Time       `json:"createdAt"`
	UpdatedAt    time.Time       `json:"updatedAt"`
}

type Approval struct {
	ID             string          `json:"id"`
	EnterpriseID   string          `json:"enterpriseId"`
	ApprovalType   string          `json:"approvalType"`
	RequestedBy    string          `json:"requestedBy"`
	Status         string          `json:"status"`
	RequiredQuorum int             `json:"requiredQuorum"`
	CurrentQuorum  int             `json:"currentQuorum"`
	Payload        json.RawMessage `json:"payload"`
	IdempotencyKey *string         `json:"idempotencyKey"`
	ExpiresAt      *time.Time      `json:"expiresAt"`
	ResolvedAt     *time.Time      `json:"resolvedAt"`
	CreatedAt      time.Time       `json:"createdAt"`
}

type ApprovalVote struct {
	ID         string    `json:"id"`
	ApprovalID string    `json:"approvalId"`
	VoterID    string    `json:"voterId"`
	Vote       string    `json:"vote"`
	Comment    *string   `json:"comment"`
	CreatedAt  time.Time `json:"createdAt"`
}

type AuditLog struct {
	ID           string          `json:"id"`
	EnterpriseID *string         `json:"enterpriseId"`
	ActorID      *string         `json:"actorId"`
	Action       string          `json:"action"`
	ResourceType *string         `json:"resourceType"`
	ResourceID   *string         `json:"resourceId"`
	Details      json.RawMessage `json:"details"`
	IPAddress    *string         `json:"ipAddress"`
	UserAgent    *string         `json:"userAgent"`
	CreatedAt    time.Time       `json:"createdAt"`
}
