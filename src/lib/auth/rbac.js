export function requireRole(user, roles = []) {
  if (!user) return false;
  return roles.includes(user.role);
}

export function requireSameDomainOrSuperAdmin(user, domainId) {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role === "ADMIN") return user.domainId === domainId;
  return false;
}
