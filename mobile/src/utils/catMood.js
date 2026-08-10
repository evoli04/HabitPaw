export function getCatMood(completed, total, hour = new Date().getHours()) {
  if (total === 0) return 'neutral';
  const percent = (completed / total) * 100;
  if (percent === 0) return 'sad';
  if ((hour >= 22 || hour < 7) && percent < 40) return 'sleepy';
  if (percent < 70) return 'neutral';
  if (percent < 100) return 'happy';
  return 'excited';
}
