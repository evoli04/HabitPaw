export const FREQUENCIES = [
  { value: 'daily', label: 'Her gün' },
  { value: 'weekdays', label: 'Hafta içi' },
  { value: 'weekends', label: 'Hafta sonu' },
];

export function getFrequencyLabel(value) {
  return FREQUENCIES.find((item) => item.value === value)?.label ?? value;
}
