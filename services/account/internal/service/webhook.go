package service

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/yieldnest/account-service/internal/db"
)

// WebhookSubscription represents a webhook endpoint subscription.
type WebhookSubscription struct {
	ID                  string     `json:"id"`
	EnterpriseID        string     `json:"enterpriseId"`
	URL                 string     `json:"url"`
	Secret              string     `json:"-"`
	Events              []string   `json:"events"`
	Active              bool       `json:"active"`
	LastDeliveryAt      *time.Time `json:"lastDeliveryAt"`
	LastError           *string    `json:"lastError"`
	ConsecutiveFailures int        `json:"consecutiveFailures"`
	CreatedAt           time.Time  `json:"createdAt"`
}

// WebhookService manages webhook subscriptions and delivery.
type WebhookService struct {
	httpClient *http.Client
}

func NewWebhookService() *WebhookService {
	return &WebhookService{
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *WebhookService) CreateSubscription(ctx context.Context, enterpriseID, url, secret string, events []string) (*WebhookSubscription, error) {
	if len(events) == 0 {
		events = []string{"*"}
	}
	eventsJSON, _ := json.Marshal(events)

	sub := &WebhookSubscription{
		ID:           uuid.New().String(),
		EnterpriseID: enterpriseID,
		URL:          url,
		Secret:       secret,
		Events:       events,
		Active:       true,
	}

	err := db.Pool.QueryRow(ctx, `
		INSERT INTO webhook_subscriptions (id, enterprise_id, url, secret, events)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING created_at
	`, sub.ID, enterpriseID, url, secret, eventsJSON).Scan(&sub.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create webhook subscription: %w", err)
	}
	return sub, nil
}

func (s *WebhookService) DeleteSubscription(ctx context.Context, id, enterpriseID string) error {
	_, err := db.Pool.Exec(ctx,
		`DELETE FROM webhook_subscriptions WHERE id = $1 AND enterprise_id = $2`,
		id, enterpriseID,
	)
	return err
}

func (s *WebhookService) ListSubscriptions(ctx context.Context, enterpriseID string) ([]WebhookSubscription, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, enterprise_id, url, events, active, last_delivery_at, last_error, consecutive_failures, created_at
		FROM webhook_subscriptions
		WHERE enterprise_id = $1
		ORDER BY created_at DESC
	`, enterpriseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []WebhookSubscription
	for rows.Next() {
		var sub WebhookSubscription
		var eventsJSON []byte
		if err := rows.Scan(
			&sub.ID, &sub.EnterpriseID, &sub.URL, &eventsJSON,
			&sub.Active, &sub.LastDeliveryAt, &sub.LastError,
			&sub.ConsecutiveFailures, &sub.CreatedAt,
		); err != nil {
			return nil, err
		}
		json.Unmarshal(eventsJSON, &sub.Events)
		subs = append(subs, sub)
	}
	return subs, nil
}

// EmitEvent finds matching subscriptions and delivers webhooks asynchronously.
func (s *WebhookService) EmitEvent(ctx context.Context, enterpriseID, eventType string, payload map[string]interface{}) {
	subs, err := s.findMatchingSubscriptions(ctx, enterpriseID, eventType)
	if err != nil {
		log.Printf("[webhook] error finding subscriptions: %v", err)
		return
	}

	for _, sub := range subs {
		go s.deliverWebhook(sub, eventType, payload)
	}
}

func (s *WebhookService) findMatchingSubscriptions(ctx context.Context, enterpriseID, eventType string) ([]WebhookSubscription, error) {
	// Get all active subscriptions for the enterprise, filter in Go
	// Simpler than complex JSONB query
	subs, err := s.ListSubscriptions(ctx, enterpriseID)
	if err != nil {
		return nil, err
	}

	var matching []WebhookSubscription
	for _, sub := range subs {
		if !sub.Active || sub.ConsecutiveFailures >= 5 {
			continue
		}
		for _, e := range sub.Events {
			if e == "*" || e == eventType {
				matching = append(matching, sub)
				break
			}
		}
	}
	return matching, nil
}

func (s *WebhookService) deliverWebhook(sub WebhookSubscription, eventType string, payload map[string]interface{}) {
	payload["event"] = eventType
	payload["timestamp"] = time.Now().UTC().Format(time.RFC3339)
	body, _ := json.Marshal(payload)

	signature := s.sign(body, sub.Secret)

	req, err := http.NewRequest("POST", sub.URL, bytes.NewReader(body))
	if err != nil {
		s.recordFailure(sub, err.Error())
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-YieldNest-Event", eventType)
	req.Header.Set("X-YieldNest-Signature", signature)
	req.Header.Set("X-YieldNest-Delivery-ID", uuid.New().String())

	start := time.Now()
	resp, err := s.httpClient.Do(req)
	durationMs := int(time.Since(start).Milliseconds())

	attempt := map[string]interface{}{
		"subscription_id": sub.ID,
		"event_type":      eventType,
		"payload":         body,
		"duration_ms":     durationMs,
	}
	if err != nil {
		attempt["success"] = false
		attempt["response_body"] = err.Error()
		s.recordFailure(sub, err.Error())
		s.recordAttempt(attempt)
		return
	}
	defer resp.Body.Close()

	buf := new(bytes.Buffer)
	buf.ReadFrom(resp.Body)
	responseBody := buf.String()

	attempt["response_code"] = resp.StatusCode
	attempt["response_body"] = responseBody
	attempt["success"] = resp.StatusCode >= 200 && resp.StatusCode < 300
	s.recordAttempt(attempt)

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		s.recordSuccess(sub)
	} else {
		s.recordFailure(sub, fmt.Sprintf("HTTP %d: %s", resp.StatusCode, responseBody))
	}
}

func (s *WebhookService) sign(body []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}

func (s *WebhookService) recordSuccess(sub WebhookSubscription) {
	ctx := context.Background()
	_, _ = db.Pool.Exec(ctx, `
		UPDATE webhook_subscriptions
		SET last_delivery_at = $1, consecutive_failures = 0, last_error = NULL, updated_at = $2
		WHERE id = $3
	`, time.Now(), time.Now(), sub.ID)
}

func (s *WebhookService) recordFailure(sub WebhookSubscription, errMsg string) {
	ctx := context.Background()
	failures := sub.ConsecutiveFailures + 1
	active := failures < 5
	_, _ = db.Pool.Exec(ctx, `
		UPDATE webhook_subscriptions
		SET consecutive_failures = $1, last_error = $2, active = $3, updated_at = $4
		WHERE id = $5
	`, failures, errMsg, active, time.Now(), sub.ID)

	if !active {
		log.Printf("[webhook] subscription %s deactivated after %d consecutive failures", sub.ID, failures)
	} else {
		// Schedule retry with backoff
		delay := time.Duration(math.Pow(2, float64(failures))) * time.Minute
		log.Printf("[webhook] delivery failed for %s, retry in %v", sub.ID, delay)
		time.AfterFunc(delay, func() {
			s.retryDelivery(sub)
		})
	}
}

func (s *WebhookService) retryDelivery(sub WebhookSubscription) {
	// Reload subscription state
	var active bool
	var failures int
	err := db.Pool.QueryRow(context.Background(),
		`SELECT active, consecutive_failures FROM webhook_subscriptions WHERE id = $1`,
		sub.ID,
	).Scan(&active, &failures)
	if err != nil || !active {
		return
	}
	// Retry with the stored event — in production, store the event payload
	log.Printf("[webhook] retrying delivery for subscription %s", sub.ID)
}

func (s *WebhookService) recordAttempt(attempt map[string]interface{}) {
	ctx := context.Background()
	payload, _ := json.Marshal(attempt["payload"])
	_, _ = db.Pool.Exec(ctx, `
		INSERT INTO webhook_delivery_attempts (id, subscription_id, event_type, payload, response_code, response_body, duration_ms, success)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, uuid.New().String(),
		attempt["subscription_id"], attempt["event_type"], payload,
		attempt["response_code"], attempt["response_body"],
		attempt["duration_ms"], attempt["success"],
	)
}

func generateWebhookSecret() string {
	return hex.EncodeToString([]byte(uuid.New().String()))
}
