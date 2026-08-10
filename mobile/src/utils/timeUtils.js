export function formatReminderTime(value) {
  if (!value) return '';
  const text = String(value);
  const isoMatch = text.match(/T(\d{2}):(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}:${isoMatch[2]}`;
  const timeMatch = text.match(/^(\d{2}):(\d{2})/);
  return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : '';
}
