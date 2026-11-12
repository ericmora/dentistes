package auth

import (
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestHashAndVerifyPassword(t *testing.T) {
	pass := "StrongDentalSecret2026!"
	encoded, err := HashPassword(pass)
	if err != nil {
		t.Fatalf("unexpected hash error: %v", err)
	}
	if !strings.HasPrefix(encoded, "$argon2id$v=19$") {
		t.Fatalf("unexpected hash format: %s", encoded)
	}

	valid, err := VerifyPassword(pass, encoded)
	if err != nil || !valid {
		t.Fatalf("expected password to verify correctly, valid=%v, err=%v", valid, err)
	}

	wrong, err := VerifyPassword("wrong-password", encoded)
	if err != nil || wrong {
		t.Fatalf("expected wrong password to fail verification, wrong=%v, err=%v", wrong, err)
	}
}

func TestVerifyPasswordInvalidFormats(t *testing.T) {
	cases := []string{
		"",
		"plain-text",
		"$bcrypt$v=19$m=65536,t=3,p=2$abc$def",
		"$argon2id$v=19$invalid_params$abc$def",
		"$argon2id$v=19$m=notanumber,t=3,p=2$abc$def",
		"$argon2id$v=19$m=65536,t=3,p=2$!!!invalid-salt-b64$def",
		"$argon2id$v=19$m=65536,t=3,p=2$YWJj$!!!invalid-hash-b64",
	}

	for _, tc := range cases {
		valid, err := VerifyPassword("pass", tc)
		if valid || err == nil {
			t.Fatalf("expected error for invalid format %q, got valid=%v, err=%v", tc, valid, err)
		}
	}
}

func TestRolesAndPermissions(t *testing.T) {
	if !ValidRole(RoleOwner) || !ValidRole(RoleAdmin) || !ValidRole(RoleDentist) || !ValidRole(RoleReceptionist) {
		t.Fatal("expected standard roles to be valid")
	}
	if ValidRole("SUPERMAN") {
		t.Fatal("expected unknown role to be invalid")
	}

	// Owner has wildcard permission
	if !HasPermission(RoleOwner, "any:arbitrary:perm") {
		t.Fatal("expected owner to have wildcard permission")
	}

	// Admin permissions
	if !HasPermission(RoleAdmin, "users:manage") || !HasPermission(RoleAdmin, "billing:manage") {
		t.Fatal("expected admin to have users:manage and billing:manage")
	}

	// Dentist permissions
	if !HasPermission(RoleDentist, "clinical:write") || HasPermission(RoleDentist, "users:manage") {
		t.Fatal("unexpected dentist permissions")
	}

	// Unknown role
	if HasPermission("UNKNOWN_ROLE", "patients:read") {
		t.Fatal("expected unknown role to have zero permissions")
	}
	if len(PermissionsFor("UNKNOWN_ROLE")) != 0 {
		t.Fatal("expected empty slice for unknown role")
	}

	// Copy isolation
	ownerPerms := PermissionsFor(RoleOwner)
	if len(ownerPerms) != 1 || ownerPerms[0] != "*" {
		t.Fatalf("unexpected owner perms: %#v", ownerPerms)
	}
	ownerPerms[0] = "mutated"
	if PermissionsFor(RoleOwner)[0] == "mutated" {
		t.Fatal("PermissionsFor must return defensive copy")
	}
}

func TestTokenManagerIssueAndParse(t *testing.T) {
	secret := "test-secret-at-least-32-bytes-long-super-safe"
	tm := NewTokenManager(secret, 15*time.Minute)

	tok, expiresAt, err := tm.Issue("user_123", "tenant_456", RoleOwner, true)
	if err != nil {
		t.Fatalf("failed to issue token: %v", err)
	}
	if tok == "" || expiresAt.Before(time.Now()) {
		t.Fatalf("invalid token issuance: tok=%s, exp=%v", tok, expiresAt)
	}

	claims, err := tm.Parse(tok)
	if err != nil {
		t.Fatalf("failed to parse token: %v", err)
	}
	if claims.Subject != "user_123" || claims.TenantID != "tenant_456" || claims.Role != RoleOwner || !claims.PlatformAdmin {
		t.Fatalf("mismatched claims: %#v", claims)
	}

	// Tampered token
	_, err = tm.Parse(tok + "tampered")
	if err == nil {
		t.Fatal("expected error parsing tampered token")
	}

	// Different secret
	wrongTM := NewTokenManager("different-secret-key-32-bytes-length!!", 15*time.Minute)
	_, err = wrongTM.Parse(tok)
	if err == nil {
		t.Fatal("expected error parsing token with different secret")
	}

	// Unexpected signing method (none)
	noneTok := jwt.NewWithClaims(jwt.SigningMethodNone, claims)
	unsigned, _ := noneTok.SignedString(jwt.UnsafeAllowNoneSignatureType)
	if _, err := tm.Parse(unsigned); err == nil {
		t.Fatal("expected error for unsigned/none token")
	}

	// Expired token
	expiredTM := NewTokenManager(secret, -1*time.Minute)
	expiredTok, _, err := expiredTM.Issue("user_123", "tenant_456", RoleDentist, false)
	if err != nil {
		t.Fatalf("failed to issue expired token: %v", err)
	}
	_, err = tm.Parse(expiredTok)
	if err == nil {
		t.Fatal("expected error parsing expired token")
	}
}

func TestRefreshToken(t *testing.T) {
	plain, hash, err := NewRefreshToken()
	if err != nil {
		t.Fatalf("failed to generate refresh token: %v", err)
	}
	if plain == "" || hash == "" {
		t.Fatalf("empty refresh token: plain=%s, hash=%s", plain, hash)
	}
	if HashRefreshToken(plain) != hash {
		t.Fatal("HashRefreshToken does not match generated hash")
	}
}
