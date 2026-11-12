package store

import (
	"testing"
	"time"
)

func TestScoreWaitingCandidate(t *testing.T) {
	monMorning := time.Date(2026, 11, 16, 10, 0, 0, 0, time.UTC) // Monday 10:00
	monMorningEnd := monMorning.Add(45 * time.Minute)

	urgent := WaitingListEntry{
		ID:                       "1",
		EstimatedDurationMinutes: 30,
		PreferredTimeSlot:        "MORNING",
		PreferredDays:            []int32{1, 3, 5},
		UrgencyLevel:             "URGENT",
	}
	score, ok := ScoreWaitingCandidate(urgent, monMorning, monMorningEnd, "doc1")
	if !ok || score < 90 {
		t.Fatalf("expected high score for urgent morning match, got %d (ok=%v)", score, ok)
	}

	tooLong := WaitingListEntry{
		ID:                       "2",
		EstimatedDurationMinutes: 60,
		PreferredTimeSlot:        "ANY",
		UrgencyLevel:             "URGENT",
	}
	if _, ok := ScoreWaitingCandidate(tooLong, monMorning, monMorningEnd, "doc1"); ok {
		t.Fatal("expected candidate requiring 60m to be incompatible with 45m slot")
	}

	normalAfternoon := WaitingListEntry{
		ID:                       "3",
		EstimatedDurationMinutes: 30,
		PreferredTimeSlot:        "AFTERNOON",
		PreferredDays:            []int32{2},
		UrgencyLevel:             "NORMAL",
	}
	lowScore, ok := ScoreWaitingCandidate(normalAfternoon, monMorning, monMorningEnd, "doc1")
	if !ok || lowScore >= score {
		t.Fatalf("expected mismatched slot/day normal candidate (%d) to score lower than urgent match (%d)", lowScore, score)
	}
}
