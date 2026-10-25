import { useState } from 'react';
import { useStore } from '../store';

export default function SettingsPage() {
  const { settings, updateSettings, habits, transactions, credits, courses } = useStore();
  const [showClear, setShowClear] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    const data = {
      habits: useStore.getState().habits,
      habitCompletions: useStore.getState().habitCompletions,
      transactions: useStore.getState().transactions,
      categories: useStore.getState().categories,
      credits: useStore.getState().credits,
      creditPayments: useStore.getState().creditPayments,
      courses: useStore.getState().courses,
      doseMarks: useStore.getState().doseMarks,
      settings: useStore.getState().settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zed-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          const state = useStore.getState();
          if (data.habits) state.habits = data.habits;
          if (data.habitCompletions) state.habitCompletions = data.habitCompletions;
          if (data.transactions) state.transactions = data.transactions;
          if (data.categories) state.categories = data.categories;
          if (data.credits) state.credits = data.credits;
          if (data.creditPayments) state.creditPayments = data.creditPayments;
          if (data.courses) state.courses = data.courses;
          if (data.doseMarks) state.doseMarks = data.doseMarks;
          if (data.settings) state.updateSettings(data.settings);
          state.showSnackbar('Данные импортированы');
        } catch {
          useStore.getState().showSnackbar('Ошибка импорта');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    localStorage.removeItem('zed-desktop-storage');
    window.location.reload();
  };

  return (
    <div className="page-enter h-full overflow-y-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">НАСТРОЙКИ</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Конфигурация приложения</p>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Тема */}
        <div className="glass-card">
          <span className="section-label mb-4 block">ТЕМА</span>
          <div className="flex gap-2">
            {(['dark', 'light', 'system'] as const).map((t) => (
              <button
                key={t}
                className={`zed-btn flex-1 ${settings.theme === t ? 'zed-btn-primary' : 'zed-btn-ghost'}`}
                onClick={() => updateSettings({ theme: t })}
              >
                {t === 'dark' ? 'ТЁМНАЯ' : t === 'light' ? 'СВЕТЛАЯ' : 'СИСТЕМНАЯ'}
              </button>
            ))}
          </div>
        </div>

        {/* Язык */}
        <div className="glass-card">
          <span className="section-label mb-4 block">ЯЗЫК</span>
          <div className="flex gap-2">
            {(['ru', 'en'] as const).map((l) => (
              <button
                key={l}
                className={`zed-btn flex-1 ${settings.language === l ? 'zed-btn-primary' : 'zed-btn-ghost'}`}
                onClick={() => updateSettings({ language: l })}
              >
                {l === 'ru' ? 'РУССКИЙ' : 'ENGLISH'}
              </button>
            ))}
          </div>
        </div>

        {/* Уведомления */}
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="section-label block mb-1">УВЕДОМЛЕНИЯ</span>
              <p className="text-xs text-[var(--text-secondary)]">Звуки и напоминания</p>
            </div>
            <button
              className={`w-12 h-6 rounded-full transition-colors ${settings.notifications ? 'bg-[var(--accent)]' : 'bg-[var(--border-visible)]'}`}
              onClick={() => updateSettings({ notifications: !settings.notifications })}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Glyph */}
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="section-label block mb-1">GLYPH</span>
              <p className="text-xs text-[var(--text-secondary)]">Вспышки рамки при успехе</p>
            </div>
            <button
              className={`w-12 h-6 rounded-full transition-colors ${settings.glyph ? 'bg-[var(--accent)]' : 'bg-[var(--border-visible)]'}`}
              onClick={() => updateSettings({ glyph: !settings.glyph })}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.glyph ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Иконки меню */}
        <div className="glass-card">
          <span className="section-label mb-4 block">ИНТЕРФЕЙС: ИКОНКИ МЕНЮ</span>
          <div className="flex gap-2">
            {(['lines', 'dots'] as const).map((s) => (
              <button
                key={s}
                className={`zed-btn flex-1 ${settings.iconSet === s ? 'zed-btn-primary' : 'zed-btn-ghost'}`}
                onClick={() => updateSettings({ iconSet: s })}
              >
                {s === 'lines' ? 'ЛИНИИ' : 'ТОЧКИ'}
              </button>
            ))}
          </div>
        </div>

        {/* Данные */}
        <div className="glass-card">
          <span className="section-label mb-4 block">ДАННЫЕ</span>
          <div className="space-y-3">
            <button className="zed-btn zed-btn-ghost w-full" onClick={handleExport}>
              {exported ? '✓ ЭКСПОРТИРОВАНО' : 'ЭКСПОРТ JSON'}
            </button>
            <button className="zed-btn zed-btn-ghost w-full" onClick={handleImport}>
              ИМПОРТ JSON
            </button>
            <button
              className="zed-btn w-full text-[var(--accent)] border border-[var(--accent)]/30 bg-transparent hover:bg-[var(--accent)]/10"
              onClick={() => setShowClear(true)}
            >
              ПОЛНАЯ ОЧИСТКА
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="glass-card">
          <span className="section-label mb-4 block">О ПРИЛОЖЕНИИ</span>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="font-dot text-xl text-white">{habits.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Привычки</p>
            </div>
            <div className="text-center">
              <p className="font-dot text-xl text-white">{transactions.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Транзакции</p>
            </div>
            <div className="text-center">
              <p className="font-dot text-xl text-white">{credits.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Кредиты</p>
            </div>
            <div className="text-center">
              <p className="font-dot text-xl text-white">{courses.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Курсы</p>
            </div>
          </div>
          <div className="text-center pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-disabled)] mb-2">ZED DESKTOP v1.0</p>
            <p className="font-dot text-xs text-[var(--text-disabled)] italic">
              «Руки Бога так тряслись, когда он создавал наш свет»
            </p>
          </div>
        </div>
      </div>

      {/* Подтверждение очистки */}
      {showClear && (
        <div className="modal-overlay" onClick={() => setShowClear(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2 text-[var(--accent)]">ВНИМАНИЕ</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Все данные будут удалены безвозвратно. Рекомендуется сначала экспортировать бэкап.
            </p>
            <div className="flex gap-3">
              <button className="zed-btn zed-btn-ghost flex-1" onClick={() => setShowClear(false)}>
                ОТМЕНА
              </button>
              <button className="zed-btn zed-btn-primary flex-1" onClick={handleClear}>
                УДАЛИТЬ ВСЁ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
