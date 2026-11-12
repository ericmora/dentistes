package realtime

import (
	"encoding/json"
	"sync"
	"time"
)

type Event struct {
	Type      string    `json:"type"`
	TenantID  string    `json:"tenant_id"`
	Payload   any       `json:"payload,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

type Hub struct {
	mu   sync.RWMutex
	subs map[string]map[chan []byte]struct{}
}

func NewHub() *Hub {
	return &Hub{subs: make(map[string]map[chan []byte]struct{})}
}

func (h *Hub) Subscribe(tenantID string) (<-chan []byte, func()) {
	ch := make(chan []byte, 32)
	h.mu.Lock()
	if h.subs[tenantID] == nil {
		h.subs[tenantID] = make(map[chan []byte]struct{})
	}
	h.subs[tenantID][ch] = struct{}{}
	h.mu.Unlock()

	cancel := func() {
		h.mu.Lock()
		if set, ok := h.subs[tenantID]; ok {
			delete(set, ch)
			if len(set) == 0 {
				delete(h.subs, tenantID)
			}
		}
		close(ch)
		h.mu.Unlock()
	}
	return ch, cancel
}

func (h *Hub) Publish(tenantID, eventType string, payload any) {
	data, err := json.Marshal(Event{
		Type:      eventType,
		TenantID:  tenantID,
		Payload:   payload,
		Timestamp: time.Now().UTC(),
	})
	if err != nil {
		return
	}

	h.mu.RLock()
	set := h.subs[tenantID]
	for ch := range set {
		select {
		case ch <- data:
		default:
		}
	}
	h.mu.RUnlock()
}
