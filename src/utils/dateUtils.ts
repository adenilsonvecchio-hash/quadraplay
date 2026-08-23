// Date and time utility functions localized for Brasília (America/Sao_Paulo)

/**
 * Returns today's date string in YYYY-MM-DD in Brasilia Timezone
 */
export function getBrasiliaToday(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (year && month && day) return `${year}-${month}-${day}`;
  return now.toISOString().slice(0, 10);
}

/**
 * Returns the current time string in HH:mm in Brasilia Timezone
 */
export function getBrasiliaCurrentTime(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  const formatter = new Intl.DateTimeFormat('pt-BR', options);
  return formatter.format(now);
}

/**
 * Formats a YYYY-MM-DD date into a friendly Brazilian format
 * e.g., "Sábado, 22 de Ago" or "22 de Agosto de 2026"
 */
export function formatFriendlyDate(dateStr: string, includeDayOfWeek: boolean = true): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayOfWeekCapitalized = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
  
  const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const monthFull = date.toLocaleDateString('pt-BR', { month: 'long' });

  if (includeDayOfWeek) {
    return `${dayOfWeekCapitalized}, ${day} de ${monthName}`;
  }
  return `${day} de ${monthFull} de ${year}`;
}

export function formatDayAndMonth(dateStr: string): { day: string; month: string; weekday: string } {
  if (!dateStr) return { day: '', month: '', weekday: '' };
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const dayFormatted = String(day).padStart(2, '0');
  const monthFormatted = date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');

  return { day: dayFormatted, month: monthFormatted, weekday };
}

/**
 * Adds days to a date string YYYY-MM-DD
 */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if date1 is strictly before date2 (YYYY-MM-DD)
 */
export function isBeforeDate(date1: string, date2: string): boolean {
  return date1 < date2;
}

/**
 * Generates available 1-hour or custom duration slots between openTime and closeTime
 */
export function generateDaySlots(openTime: string = "06:00", closeTime: string = "22:00", slotMinutes: number = 60): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  let currentMinutes = openHour * 60 + openMin;
  const endMinutes = closeHour * 60 + closeMin;

  while (currentMinutes + slotMinutes <= endMinutes) {
    const startH = Math.floor(currentMinutes / 60);
    const startM = currentMinutes % 60;
    const endH = Math.floor((currentMinutes + slotMinutes) / 60);
    const endM = (currentMinutes + slotMinutes) % 60;

    const startTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    slots.push({ startTime, endTime });
    currentMinutes += slotMinutes;
  }

  return slots;
}

/**
 * Checks if a slot time on a specific date has already passed today
 */
export function isSlotInPast(dateStr: string, startTime: string): boolean {
  const today = getBrasiliaToday();
  if (dateStr < today) return true;
  if (dateStr > today) return false;

  // Same day: compare current time
  const currentTime = getBrasiliaCurrentTime();
  return startTime <= currentTime;
}
