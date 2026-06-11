export function buildSearchKeywords(uid: string, email: string, displayName: string) {
  const source = [uid, email, displayName].join(' ').toLowerCase();
  const words = source
    .split(/[\s@._-]+/)
    .map((word) => word.trim())
    .filter(Boolean);

  return Array.from(new Set([
    uid.toLowerCase(),
    email.toLowerCase(),
    displayName.toLowerCase(),
    ...words,
  ]));
}
