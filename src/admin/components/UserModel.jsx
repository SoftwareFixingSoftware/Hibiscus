// src/models/UserModel.js
/**
 * Lightweight mapper & helpers for user DTOs
 * Keep UI logic away from raw backend DTO shapes.
 */

const toIso = (v) => {
  if (!v) return null;
  // already ISO-like?
  if (typeof v === 'string') return v;
  // Date object
  if (v instanceof Date) return v.toISOString();
  try {
    // attempt to create Date (handles LocalDateTime strings too)
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  } catch (e) {
    // fallthrough
  }
  return null;
};

export const mapDtoToUser = (dto = {}) => ({
  userId: dto.userId || dto.id || null,
  authProvider: dto.authProvider || dto.provider || 'local',
  email: dto.email || '',
  name: dto.name || '',
  username: dto.username || '',
  avatarUrl: dto.avatarUrl || null,
  locale: dto.locale || 'en',
  countryCode: dto.countryCode || null,
  active: typeof dto.active === 'boolean' ? dto.active : !!dto.isActive,
  emailVerified: typeof dto.emailVerified === 'boolean' ? dto.emailVerified : !!dto.isEmailVerified || !!dto.emailVerified,
  admin: typeof dto.admin === 'boolean' ? dto.admin : !!dto.isAdmin,
  createdAt: toIso(dto.createdAt || dto.created_at || null),
  updatedAt: toIso(dto.updatedAt || dto.updated_at || null),
  lastSeenAt: toIso(dto.lastSeenAt || dto.last_seen_at || null),
  deletedAt: toIso(dto.deletedAt || dto.deleted_at || null),
});

// Small helper for safe display name
export const displayName = (user) => {
  if (!user) return '';
  if (user.name && user.name.trim()) return user.name;
  if (user.username && user.username.trim()) return user.username;
  return user.email || '';
};