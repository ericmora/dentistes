package auth

import "slices"

var rolePermissions = map[string][]string{
	"OWNER": {"*"},
	"ADMIN": {
		"patients:read", "patients:write",
		"clinical:read", "clinical:write",
		"appointments:read", "appointments:write",
		"billing:read", "billing:write", "billing:manage",
		"users:manage", "settings:manage",
	},
	"DENTIST": {
		"patients:read", "patients:write",
		"clinical:read", "clinical:write",
		"appointments:read", "appointments:write",
		"billing:read",
	},
	"HYGIENIST": {
		"patients:read",
		"clinical:alerts",
		"appointments:read", "appointments:write",
	},
	"RECEPTIONIST": {
		"patients:read", "patients:write",
		"clinical:alerts",
		"appointments:read", "appointments:write",
		"billing:read", "billing:write",
	},
}

func ValidRole(role string) bool {
	_, ok := rolePermissions[role]
	return ok
}

func PermissionsFor(role string) []string {
	perms, ok := rolePermissions[role]
	if !ok {
		return []string{}
	}
	out := make([]string, len(perms))
	copy(out, perms)
	return out
}

func HasPermission(role, permission string) bool {
	perms, ok := rolePermissions[role]
	if !ok {
		return false
	}
	if slices.Contains(perms, "*") {
		return true
	}
	return slices.Contains(perms, permission)
}
