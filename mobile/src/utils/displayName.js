export function getDisplayName(user, profile) {
  const metadata = user?.user_metadata ?? {};
  const candidates = [
    profile?.name,
    metadata.name,
    metadata.full_name,
    metadata.fullName,
    metadata.display_name,
    metadata.username,
  ];
  const name = candidates.find((value) => typeof value === 'string' && value.trim());
  if (name) return name.trim();

  const emailName = user?.email?.split('@')[0]?.trim();
  if (emailName) {
    return emailName
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('tr-TR'));
  }
  return 'HabitPaw kullanıcısı';
}
