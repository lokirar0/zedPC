import { useState } from 'react';
import { useStore, currentYearMonth } from '../store';
import { formatMoney } from '../utils';

export default function CreditsPage() {
  const { credits, creditPayments, addCredit, deleteCredit, toggleCreditPayment } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPayment, setNewPayment] = useState('');
  const [newDay, setNewDay] = useState(15);
  const [newTotalMonths, setNewTotalMonths] = useState(12);
  const [newNote, setNewNote] = useState('');

  const ym = currentYearMonth();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Ближайший платёж
  const upcoming = credits
    .map((c) => {
      const isPaid = creditPayments.some((p) => p.creditId === c.id && p.yearMonth === ym);
      const paymentDate = new Date(year, month, c.paymentDay);
      const isPast = paymentDate < now;
      return { ...c, isPaid, paymentDate, isPast, status: isPaid ? 'ОПЛАЧЕНО' : isPast ? 'ПРОСРОЧЕНО' : `Д-${c.paymentDay - now.getDate()}` };
    })
    .sort((a, b) => {
      if (a.isPaid && !b.isPaid) return 1;
      if (!a.isPaid && b.isPaid) return -1;
      return a.paymentDate.getTime() - b.paymentDate.getTime();
    });

  const nearest = upcoming.find((c) => !c.isPaid);

  const handleAdd = () => {
    const paymentMinor = Math.round(parseFloat(newPayment) * 100);
    if (!newTitle.trim() || isNaN(paymentMinor) || paymentMinor <= 0) return;
    addCredit({
      title: newTitle.trim(),
      monthlyPaymentMinor: paymentMinor,
      paymentDay: newDay,
      note: newNote,
      totalMonths: newTotalMonths,
      startDate: ym,
    });
    setNewTitle('');
    setNewPayment('');
    setNewNote('');
    setShowAdd(false);
  };

  // Календарь-сетка месяца
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1); i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  // Дни платежей в этом месяце
  const paymentDays = new Set(credits.map((c) => c.paymentDay));

  return (
    <div className="page-enter h-full overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">КРЕДИТЫ</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Платежи и контроль</p>
        </div>
        <button className="fab" onClick={() => setShowAdd(true)}>+</button>
      </div>

      {/* Ближайший платёж */}
      {nearest && (
        <div className="glass-card mb-6 border-[var(--accent)]">
          <span className="section-label mb-3 block">БЛИЖАЙШИЙ ПЛАТЁЖ</span>
          <p className="font-dot text-3xl text-white mb-2">{formatMoney(nearest.monthlyPaymentMinor)}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            СПИСАНИЕ | {nearest.paymentDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* Точечный календарь месяца */}
      <div className="glass-card mb-6">
        <span className="section-label mb-4 block">
          {now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).toUpperCase()}
        </span>
        <div className="calendar-grid mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
            <div key={d} className="calendar-cell text-[10px] text-[var(--text-disabled)]">{d}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={i} />;
            const isPaymentDay = paymentDays.has(day);
            const isPaid = creditPayments.some((p) => {
              const [py, pm] = p.yearMonth.split('-').map(Number);
              return py === year && pm === month + 1;
            });
            const isToday = day === now.getDate();
            const isFuture = day > now.getDate();
            return (
              <div
                key={i}
                className={`calendar-cell ${
                  isPaymentDay && !isPaid ? 'urgent' :
                  isPaymentDay && isPaid ? 'paid' :
                  isFuture ? 'future' : ''
                } ${isToday ? 'today' : ''}`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Список кредитов */}
      <div className="space-y-3">
        {upcoming.map((credit) => {
          // Прогресс: сколько месяцев оплачено в году
          const yearPayments = creditPayments.filter((p) => {
            const [py] = p.yearMonth.split('-').map(Number);
            return p.creditId === credit.id && py === year;
          }).length;
          const progress = (yearPayments / 12) * 100;

          return (
            <div key={credit.id} className="glass-card group">
              <div className="flex items-center gap-4">
                <div
                  className={`square-checkbox ${credit.isPaid ? 'checked' : ''}`}
                  onClick={() => toggleCreditPayment(credit.id, ym)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{credit.title}</p>
                    <span className={`text-xs font-dot px-2 py-0.5 rounded ${
                      credit.status === 'ОПЛАЧЕНО' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                      credit.status === 'ПРОСРОЧЕНО' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' :
                      'bg-[var(--border)] text-[var(--text-secondary)]'
                    }`}>
                      {credit.status}
                    </span>
                  </div>
                  <p className="font-dot text-sm text-[var(--text-secondary)] mt-1">
                    {formatMoney(credit.monthlyPaymentMinor)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-dot text-xs text-[var(--text-disabled)]">{yearPayments}/12</span>
                  <div className="w-16 thin-bar">
                    <div className="thin-bar-fill" style={{ width: `${Math.max(2, progress)}%` }} />
                  </div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-disabled)] hover:text-[var(--accent)] transition-all text-lg"
                  onClick={() => deleteCredit(credit.id)}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
        {credits.length === 0 && (
          <div className="glass-card text-center py-8">
            <p className="text-[var(--text-disabled)]">Нет кредитов</p>
          </div>
        )}
      </div>

      {/* Модалка добавления */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Новый кредит</h3>
            <input
              className="zed-input mb-3"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Название"
              autoFocus
            />
            <input
              className="zed-input mb-3 font-dot"
              type="number"
              value={newPayment}
              onChange={(e) => setNewPayment(e.target.value)}
              placeholder="Ежемесячный платёж (₽)"
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)]">День платежа</label>
                <input
                  type="number"
                  className="zed-input"
                  value={newDay}
                  onChange={(e) => setNewDay(Number(e.target.value))}
                  min={1}
                  max={31}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)]">Всего месяцев</label>
                <input
                  type="number"
                  className="zed-input"
                  value={newTotalMonths}
                  onChange={(e) => setNewTotalMonths(Number(e.target.value))}
                  min={1}
                  max={360}
                />
              </div>
            </div>
            <input
              className="zed-input mb-4"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Заметка"
            />
            <div className="flex gap-3">
              <button className="zed-btn zed-btn-ghost flex-1" onClick={() => setShowAdd(false)}>
                ОТМЕНА
              </button>
              <button className="zed-btn zed-btn-primary flex-1" onClick={handleAdd}>
                ДОБАВИТЬ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
