export function canCreateUser(currentUser, payload) {
  if (!currentUser) return false;

  //super admin can create any user
  if (currentUser.role === "SUPER_ADMIN") return true;

  //admin can create only user role within their domain
  if (currentUser.role === "ADMIN") {
    const isRoleValid = !payload.role || payload.role === "USER";
    const isDomainValid =
      !payload.domainId || payload.domainId === currentUser.domainId;
    return isRoleValid && isDomainValid;
  }
  return false;
}
