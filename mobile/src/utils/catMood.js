export function getCatMood(completed, total) {
  if (total === 0) return 'neutral';
  const percent = (completed / total) * 100;
  if (percent === 0) return 'sad';
  if (percent < 40) return 'sleepy';
  if (percent < 70) return 'neutral';
  if (percent < 100) return 'happy';
  return 'excited';
}
