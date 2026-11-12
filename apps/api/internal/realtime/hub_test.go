package realtime

import (
	"encoding/json"
	"testing"
	"time"
)

func TestHubPublishAndSubscribeIsolation(t *testing.T) {
	hub := NewHub()

	tenantA := "tenant-a"
	tenantB := "tenant-b"

	chA, cancelA := hub.Subscribe(tenantA)
	defer cancelA()

	chB, cancelB := hub.Subscribe(tenantB)
	defer cancelB()

	// Publish to tenant A
	hub.Publish(tenantA, "appointment.created", map[string]string{"id": "appt-1"})

	select {
	case msg := <-chA:
		var evt Event
		if err := json.Unmarshal(msg, &evt); err != nil {
			t.Fatalf("failed to unmarshal event: %v", err)
		}
		if evt.TenantID != tenantA || evt.Type != "appointment.created" {
			t.Fatalf("unexpected event: %#v", evt)
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("timeout waiting for tenantA event")
	}

	// Tenant B should not receive tenant A's event
	select {
	case msg := <-chB:
		t.Fatalf("tenantB unexpectedly received message: %s", string(msg))
	case <-time.After(50 * time.Millisecond):
		// Success: tenant isolation preserved
	}

	// Test unsubscribe / cancel
	cancelA()
	// Channel should be closed
	if _, ok := <-chA; ok {
		t.Fatal("expected chA to be closed after cancel")
	}

	// Publish after unsubscribe should not panic or fail
	hub.Publish(tenantA, "appointment.updated", nil)

	// Publish with un-marshallable payload (channel)
	hub.Publish(tenantB, "invalid", make(chan int))
}

func TestHubFullBufferDrop(t *testing.T) {
	hub := NewHub()
	ch, cancel := hub.Subscribe("tenant-full")
	defer cancel()

	// Fill buffer of 32
	for i := 0; i < 40; i++ {
		hub.Publish("tenant-full", "ping", i)
	}

	// Drain
	count := 0
	for {
		select {
		case <-ch:
			count++
		default:
			goto done
		}
	}
done:
	if count != 32 {
		t.Fatalf("expected buffer limit of 32 messages, got %d", count)
	}
}
