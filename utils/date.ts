import { Timestamp } from 'firebase/firestore';

function toDate(value?: Timestamp | Date | null) {
  if (!value) return null;
  return value instanceof Date ? value : value.toDate();
}

export function formatMessageTime(value?: Timestamp | Date | null) {
  const date = toDate(value);
  if (!date) return '';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatListTime(value?: Timestamp | Date | null) {
  const date = toDate(value);
  if (!date) return '';

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return formatMessageTime(date);
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}
