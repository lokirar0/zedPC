import { useState } from 'react';
import { useStore, currentYearMonth } from '../store';
import { formatMoney, formatDate, getMonthTotal, getMonthForecast, getCategoryTotals } from '../utils';

export default function FinancesPage() {
  const {
    transactions, categories, addTransaction, deleteTransaction, addCategory,
  } = useStore();

  const [showAdd, setShowAdd] = useState(false);
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState(categories[0]?.id || '');
  const [txNote, setTxNote] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const ym = currentYearMonth();
  const { income, expense } = getMonthTotal(transactions, ym);
  const forecast = getMonthForecast(transactions);
  const balance = income - expense;
  const catTotals = getCategoryTotals(transactions, categories);
  const maxCatTotal = catTotals.length > 0 ? catTotals[0].total : 1;

  const handleAdd = () => {
    const amountMinor = Math.round(parseFloat(txAmount) * 100);
    if (isNaN(amountMinor) || amountMinor <= 0) return;
    addTransaction({
      type: txType,
      amountMinor,
      categoryId: txCategory,
      note: txNote,
      dateMillis: new Date(txDate).getTime(),
    });
    setTxAmount('');
    setTxNote('');
    setShowAdd(false);
  };

  const handleQuickAdd = (catId: string) => {
    const lastTx = [...transactions]
      .filter((t) => t.categoryId === catId && t.type === 'EXPENSE')
      .sort((a, b) => b.dateMillis - a.dateMillis)[0];
    if (lastTx) {
      const { id: _id, ...rest } = lastTx;
      addTransaction({ ...rest, dateMillis: Date.now() });
      useStore.getState().showSnackbar('Повторено');
    }
  };

  // Календарь текущего месяца
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=вс
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1); i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  return (
    <div className="page-enter h-full overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">ФИНАНСЫ</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button className="fab" onClick={() => setShowAdd(true)}>+</button>
      </div>

      {/* Сводка */}
      <div className="glass-card mb-6">
        <div className="flex items-center justify-between mb-6">
          <span className="section-label">БАЛАНС МЕСЯЦА</span>
          <span className={`font-dot text-3xl ${balance >= 0 ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
            {formatMoney(balance)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-1">ДОХОДЫ</p>
            <p className="font-dot text-lg text-[var(--success)]">{formatMoney(income)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-1">РАСХОДЫ</p>
            <p className="font-dot text-lg text-[var(--accent)]">{formatMoney(expense)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-1">ПРОГНОЗ</p>
            <p className="font-dot text-lg text-white">{formatMoney(forecast)}</p>
          </div>
        </div>
        {/* Бюджет-бар */}
        <div className="thin-bar mt-4">
          <div className="thin-bar-fill" style={{ width: `${Math.min(100, Math.max(2, (expense / Math.max(income, forecast)) * 100))}%` }} />
        </div>
      </div>

      {/* Quick-Add плитки */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.slice(0, 6).map((cat) => (
          <button
            key={cat.id}
            className="glass-card px-4 py-2 text-xs font-medium whitespace-nowrap hover:border-[var(--accent)] transition-colors cursor-pointer"
            onClick={() => handleQuickAdd(cat.id)}
          >
            + {cat.name}
          </button>
        ))}
      </div>

      {/* Категории с суммами */}
      <div className="glass-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="section-label">КАТЕГОРИИ</span>
          <button className="text-xs text-[var(--accent)]" onClick={() => setShowNewCat(!showNewCat)}>
            + КАТЕГОРИЯ
          </button>
        </div>
        {showNewCat && (
          <div className="flex gap-2 mb-4">
            <input
              className="zed-input flex-1"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Название"
            />
            <button className="zed-btn zed-btn-primary" onClick={() => {
              if (newCatName.trim()) { addCategory(newCatName.trim()); setNewCatName(''); setShowNewCat(false); }
            }}>
              ОК
            </button>
          </div>
        )}
        <div className="space-y-3">
          {catTotals.map((ct) => (
            <div key={ct.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--text-primary)]">{ct.name}</span>
                <span className="font-dot text-sm text-[var(--text-secondary)]">{formatMoney(ct.total)}</span>
              </div>
              <div className="thin-bar">
                <div className="thin-bar-fill" style={{ width: `${Math.max(2, (ct.total / maxCatTotal) * 100)}%` }} />
              </div>
            </div>
          ))}
          {catTotals.length === 0 && (
            <p className="text-sm text-[var(--text-disabled)] text-center py-4">Нет расходов за месяц</p>
          )}
        </div>
      </div>

      {/* График 6 месяцев */}
      <div className="glass-card mb-6">
        <span className="section-label mb-4 block">6 МЕСЯЦЕВ</span>
        <div className="flex items-end gap-3 h-24">
          {Array.from({ length: 6 }, (_, i) => {
            const d = new Date(year, month - 5 + i, 1);
            const tym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const { expense: mExp } = getMonthTotal(transactions, tym);
            const maxExp = Math.max(...Array.from({ length: 6 }, (_, j) => {
              const dd = new Date(year, month - 5 + j, 1);
              const tym2 = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}`;
              return getMonthTotal(transactions, tym2).expense;
            }), 1);
            const h = Math.max(4, (mExp / maxExp) * 80);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-sm" style={{ height: h, background: i === 5 ? 'var(--accent)' : 'var(--border-visible)' }} />
                <span className="text-[10px] text-[var(--text-disabled)]">{d.toLocaleDateString('ru-RU', { month: 'short' }).slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Календарь месяца */}
      <div className="glass-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="section-label">КАЛЕНДАРЬ</span>
          <button className="text-xs text-[var(--accent)]" onClick={() => setShowCalendar(!showCalendar)}>
            {showCalendar ? 'СКРЫТЬ' : 'ПОКАЗАТЬ'}
          </button>
        </div>
        {showCalendar && (
          <>
            <div className="calendar-grid mb-2">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                <div key={d} className="calendar-cell text-[10px] text-[var(--text-disabled)]">{d}</div>
              ))}
            </div>
            <div className="calendar-grid">
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={i} />;
                const dayTxs = transactions.filter((t) => {
                  const d = new Date(t.dateMillis);
                  return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
                });
                const dayExpense = dayTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amountMinor, 0);
                const isToday = day === now.getDate();
                return (
                  <div
                    key={i}
                    className={`calendar-cell ${isToday ? 'today' : dayExpense > 0 ? 'paid' : 'future'}`}
                    title={dayExpense > 0 ? formatMoney(dayExpense) : ''}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Список транзакций */}
      <div className="glass-card">
        <span className="section-label mb-4 block">ТРАНЗАКЦИИ</span>
        <div className="space-y-2">
          {[...transactions]
            .sort((a, b) => b.dateMillis - a.dateMillis)
            .slice(0, 20)
            .map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              return (
                <div key={tx.id} className="flex items-center gap-3 group py-2 border-b border-[var(--border)] last:border-0">
                  <div className={`w-2 h-2 rounded-full ${tx.type === 'INCOME' ? 'bg-[var(--success)]' : 'bg-[var(--accent)]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">
                      {tx.note || cat?.name || '—'}
                    </p>
                    <p className="text-xs text-[var(--text-disabled)]">{formatDate(tx.dateMillis)}</p>
                  </div>
                  <span className={`font-dot text-sm ${tx.type === 'INCOME' ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
                    {tx.type === 'INCOME' ? '+' : '−'}{formatMoney(tx.amountMinor)}
                  </span>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-[var(--text-disabled)] hover:text-[var(--accent)] transition-all"
                    onClick={() => deleteTransaction(tx.id)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          {transactions.length === 0 && (
            <p className="text-sm text-[var(--text-disabled)] text-center py-4">Нет транзакций</p>
          )}
        </div>
      </div>

      {/* Модалка добавления */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Новая транзакция</h3>
            <div className="flex gap-2 mb-3">
              <button
                className={`zed-btn flex-1 ${txType === 'EXPENSE' ? 'zed-btn-primary' : 'zed-btn-ghost'}`}
                onClick={() => setTxType('EXPENSE')}
              >
                РАСХОД
              </button>
              <button
                className={`zed-btn flex-1 ${txType === 'INCOME' ? 'zed-btn-primary' : 'zed-btn-ghost'}`}
                onClick={() => setTxType('INCOME')}
              >
                ДОХОД
              </button>
            </div>
            <input
              className="zed-input mb-3 font-dot text-lg"
              type="number"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              placeholder="Сумма"
              autoFocus
            />
            <select
              className="zed-input mb-3"
              value={txCategory}
              onChange={(e) => setTxCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              className="zed-input mb-3"
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
            />
            <input
              className="zed-input mb-4"
              value={txNote}
              onChange={(e) => setTxNote(e.target.value)}
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
