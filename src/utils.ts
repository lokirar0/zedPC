// ═══════════════════════════════════════════
// УТИЛИТЫ ФОРМАТИРОВАНИЯ
// ═══════════════════════════════════════════

// Форматирование суммы в копейках → рубли
export function formatMoney(minor: number): string {
  const rub = Math.floor(Math.abs(minor) / 100);
  const kop = Math.abs(minor) % 100;
  const sign = minor < 0 ? '−' : '';
  const rubStr = rub.toLocaleString('ru-RU');
  return `${sign}${rubStr},${String(kop).padStart(2, '0')} ₽`;
}

// Форматирование времени (секунды → M:SS)
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Форматирование даты
export function formatDate(millis: number): string {
  const d = new Date(millis);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Форматирование короткой даты
export function formatShortDate(millis: number): string {
  const d = new Date(millis);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

// Получить streak (серия дней) для привычки
export function getStreak(completions: { dayEpoch: number }[]): number {
  if (completions.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEpoch = Math.floor(today.getTime() / 1000);

  const sorted = [...completions].sort((a, b) => b.dayEpoch - a.dayEpoch);
  let streak = 0;
  let checkDay = todayEpoch;

  for (const c of sorted) {
    if (c.dayEpoch === checkDay) {
      streak++;
      checkDay -= 86400;
    } else if (c.dayEpoch === checkDay + 86400) {
      // Вчера было, сегодня ещё нет — пропускаем
      checkDay = c.dayEpoch - 86400;
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// Получить последние N дней (массив epoch)
export function getLastNDays(n: number): number[] {
  const days: number[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(Math.floor(d.getTime() / 1000));
  }
  return days;
}

// Процент выполнения привычек за сегодня
export function getTodayProgress(habits: { id: string }[], completions: { habitId: string; dayEpoch: number }[]): number {
  if (habits.length === 0) return 0;
  const today = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const done = completions.filter((c) => c.dayEpoch === today).length;
  return Math.round((done / habits.length) * 100);
}

// Сумма транзакций за месяц
export function getMonthTotal(transactions: { type: string; amountMinor: number; dateMillis: number }[], yearMonth: string): { income: number; expense: number } {
  const monthTxs = transactions.filter((t) => {
    const d = new Date(t.dateMillis);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return ym === yearMonth;
  });
  const income = monthTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amountMinor, 0);
  const expense = monthTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amountMinor, 0);
  return { income, expense };
}

// Прогноз до конца месяца
export function getMonthForecast(transactions: { type: string; amountMinor: number; dateMillis: number }[]): number {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const { expense } = getMonthTotal(transactions, `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  if (currentDay === 0) return 0;
  const dailyAvg = expense / currentDay;
  return Math.round(dailyAvg * daysInMonth);
}

// Категории с суммами за месяц
export function getCategoryTotals(transactions: { type: string; amountMinor: number; categoryId: string; dateMillis: number }[], categories: { id: string; name: string }[]): { name: string; total: number }[] {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTxs = transactions.filter((t) => {
    const d = new Date(t.dateMillis);
    const tym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return tym === ym && t.type === 'EXPENSE';
  });

  const totals: Record<string, number> = {};
  monthTxs.forEach((t) => {
    totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amountMinor;
  });

  return categories
    .map((c) => ({ name: c.name, total: totals[c.id] || 0 }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
}

// День курса (какой день идёт)
export function getCourseDay(course: { startDate: string; totalDays: number }): { day: number; total: number; finished: boolean } {
  const start = new Date(course.startDate);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / 86400000) + 1;
  const day = Math.max(1, diffDays);
  return { day: Math.min(day, course.totalDays), total: course.totalDays, finished: day > course.totalDays };
}

// Следующий приём курса
export function getNextDose(course: { intervalHours: number; intervalMinutes: number; firstDoseMinutes: number }): string | null {
  const intervalMs = (course.intervalHours * 60 + course.intervalMinutes) * 60000;
  const firstDoseMs = course.firstDoseMinutes * 60000;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const elapsed = now.getTime() - todayStart.getTime();

  if (elapsed < firstDoseMs) {
    const h = Math.floor(course.firstDoseMinutes / 60);
    const m = course.firstDoseMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  let next = firstDoseMs;
  while (next <= elapsed) {
    next += intervalMs;
  }
  const nextDate = new Date(todayStart.getTime() + next);
  return `${String(nextDate.getHours()).padStart(2, '0')}:${String(nextDate.getMinutes()).padStart(2, '0')}`;
}
