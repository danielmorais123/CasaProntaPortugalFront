import {
  Property,
  User,
  PermissionLevel,
  PropertyPermission,
} from "@/types/models";

/**
 * Checks if a user has access to a property (owner or permission).
 * @param user The user object.
 * @param property The property object.
 * @param requiredLevel Optional: required permission level ("Read" | "Admin" | "Temporary").
 */

export function canReadProperty(
  user: User | null | undefined,
  property: Property | null | undefined
): boolean {
  if (!user || !property) return false;
  if (property.ownerId === user.id) return true;

  const now = new Date();
  const perm = property.permissions?.find(
    (p: PropertyPermission) =>
      p.userId === user.id && (!p.expiresAt || new Date(p.expiresAt) > now)
  );
  if (!perm) return false;

  return (
    perm.permissionLevel === PermissionLevel.Read ||
    perm.permissionLevel === PermissionLevel.Admin ||
    perm.permissionLevel === PermissionLevel.Temporary
  );
}

/**
 * Checks if a user can edit a property (owner or admin permission).
 */
export function canEditProperty(
  user: User | null | undefined,
  property: Property | null | undefined
): boolean {
  if (!user || !property) return false;
  if (property.ownerId === user.id) return true;

  const now = new Date();
  const perm = property.permissions?.find(
    (p: PropertyPermission) =>
      p.userId === user.id && (!p.expiresAt || new Date(p.expiresAt) > now)
  );
  if (!perm) return false;

  return perm.permissionLevel === PermissionLevel.Admin;
}
/**
 * Returns true if the user can share the property (plan allows and not over guest limit).
 * @param user The user object.
 * @param property The property object.
 */
export function canShareProperty(
  user: User | null | undefined,
  property: Property | null | undefined
): boolean {
  if (!user || !property) return false;

  // If plan exists and MaxGuests is undefined/null, allow unlimited guests
  const maxGuests = user.plan?.limits?.MaxGuests;
  if (user.plan && (maxGuests === undefined || maxGuests === null)) {
    return true;
  }

  // Plan must allow sharing (MaxGuests > 0)
  if (!maxGuests || maxGuests <= 0) return false;

  // Count current guests (exclude owner)
  const guestCount =
    property.permissions?.filter((p) => p.userId !== property.ownerId).length ??
    0;

  return guestCount < maxGuests;
}
