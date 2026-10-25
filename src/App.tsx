import { useStore } from './store';
import HabitsPage from './pages/HabitsPage';
import FinancesPage from './pages/FinancesPage';
import CreditsPage from './pages/CreditsPage';
import PlayerPage from './pages/PlayerPage';
import SettingsPage from './pages/SettingsPage';
import { useEffect, useState } from 'react';

// ═══════════════════════════════════════════
// ZED DESKTOP — Главный компонент
// Сайдбар + контент с кроссфейдом
// ═══════════════════════════════════════════

type Page = 'habits' | 'finances' | 'credits' | 'player' | 'settings';

const navItems: { id: Page; label: string; icon: string; dotIcon: string }[] = [
  { id: 'habits', label: 'ПРИВЫЧКИ', icon: '○', dotIcon: '⠿' },
  { id: 'finances', label: 'ФИНАНСЫ', icon: '◇', dotIcon: '⠿' },
  { id: 'credits', label: 'КРЕДИТЫ', icon: '□', dotIcon: '⠿' },
  { id: 'player', label: 'ПЛЕЕР', icon: '▷', dotIcon: '⠿' },
  { id: 'settings', label: 'НАСТРОЙКИ', icon: '⚙', dotIcon: '⠿' },
];

function App() {
  const { currentPage, setPage, settings, snackbar, hideSnackbar, currentTrackId, isPlaying, tracks, togglePlay } = useStore();
  const [glyphFlash, setGlyphFlash] = useState(false);

  // Горячие клавиши Ctrl+1..5
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (navItems[idx]) setPage(navItems[idx].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setPage]);

  // Glyph-вспышка при показе снекбара (успех)
  useEffect(() => {
    if (snackbar && settings.glyph) {
      setGlyphFlash(true);
      setTimeout(() => setGlyphFlash(false), 700);
    }
  }, [snackbar, settings.glyph]);

  const currentTrack = tracks.find((t) => t.id === currentTrackId);

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${glyphFlash ? 'glyph-active' : ''}`} style={{ background: 'var(--bg)' }}>
      {/* ═══ САЙДБАР ═══ */}
      <aside className="sidebar">
        {/* Логотип */}
        <div className="mb-8 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <span className="font-dot text-white text-sm font-bold">Z</span>
            </div>
            <div>
              <h1 className="font-dot text-xl text-white tracking-wider">ZED</h1>
              <p className="text-[9px] text-[var(--text-disabled)] tracking-[0.2em] uppercase">DESKTOP</p>
            </div>
          </div>
        </div>

        {/* Навигация */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item, idx) => (
            <button
              key={item.id}
              className={`sidebar-item w-full ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="text-lg">
                {settings.iconSet === 'dots' ? (
                  <DotIcon type={item.id} />
                ) : (
                  item.icon
                )}
              </span>
              <span className="text-xs tracking-wider">{item.label}</span>
              <span className="ml-auto font-dot text-[10px] text-[var(--text-disabled)]">
                ^{idx + 1}
              </span>
            </button>
          ))}
        </nav>

        {/* Мини-плеер в сайдбаре */}
        {currentTrack && (
          <div className="glass-card mt-4 p-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex-shrink-0"
                style={{
                  background: isPlaying
                    ? 'linear-gradient(135deg, var(--accent) 0%, #1a1a1a 100%)'
                    : 'var(--surface-raised)',
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--text-primary)] truncate">{currentTrack.title}</p>
                <p className="text-[10px] text-[var(--text-disabled)] truncate">{currentTrack.artist}</p>
              </div>
              <button
                className="w-8 h-8 rounded-lg border border-[var(--border-visible)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent)] transition-colors"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Версия */}
        <div className="mt-4 px-4">
          <p className="font-dot text-[10px] text-[var(--text-disabled)]">v1.0.0</p>
        </div>
      </aside>

      {/* ═══ КОНТЕНТ ═══ */}
      <main className="flex-1 overflow-hidden">
        {/* Шапка модуля */}
        <header className="h-12 border-b border-[var(--border)] flex items-center px-8 gap-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[var(--accent)]/60" />
              <div className="w-3 h-3 rounded-full bg-[var(--warning)]/60" />
              <div className="w-3 h-3 rounded-full bg-[var(--success)]/60" />
            </div>
            <span className="font-dot text-xs text-[var(--text-disabled)] uppercase tracking-widest ml-3">
              {navItems.find((n) => n.id === currentPage)?.label}
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {isPlaying && currentTrack && (
              <div className="flex items-center gap-2 mr-4">
                <div className="flex gap-[2px] items-end h-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-[2px] bg-[var(--accent)] rounded-full"
                      style={{
                        height: `${40 + Math.random() * 60}%`,
                        animation: `wave ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-[var(--text-secondary)] truncate max-w-[120px]">
                  {currentTrack.title}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] cursor-pointer hover:border-[var(--border-visible)] transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-disabled)]">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <kbd className="text-[10px] text-[var(--text-disabled)]">Ctrl+K</kbd>
            </div>
          </div>
        </header>

        {/* Страница */}
        <div className="h-[calc(100vh-48px)] overflow-hidden">
          {currentPage === 'habits' && <HabitsPage />}
          {currentPage === 'finances' && <FinancesPage />}
          {currentPage === 'credits' && <CreditsPage />}
          {currentPage === 'player' && <PlayerPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </div>
      </main>

      {/* ═══ СНЕКБАР ═══ */}
      {snackbar && (
        <div className="snackbar">
          <span className="text-sm text-[var(--text-primary)]">{snackbar.message}</span>
          {snackbar.onUndo && (
            <button
              className="snackbar-undo"
              onClick={() => {
                snackbar.onUndo?.();
                hideSnackbar();
              }}
            >
              ОТМЕНИТЬ
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ Точечные иконки (5×5 dot-matrix) ═══
function DotIcon({ type }: { type: string }) {
  // Простые точечные паттерны 5×5
  const patterns: Record<string, boolean[][]> = {
    habits: [
      [false, true, true, true, false],
      [true, false, false, false, true],
      [true, false, false, false, false],
      [true, false, false, false, true],
      [false, true, true, true, false],
    ],
    finances: [
      [false, false, true, false, false],
      [false, true, true, true, false],
      [true, false, true, false, true],
      [false, false, true, false, false],
      [false, false, true, false, false],
    ],
    credits: [
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
    ],
    player: [
      [true, false, false, false, false],
      [true, true, false, false, false],
      [true, true, true, false, false],
      [true, true, false, false, false],
      [true, false, false, false, false],
    ],
    settings: [
      [false, true, true, true, false],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [true, false, false, false, true],
      [false, true, true, true, false],
    ],
  };

  const pattern = patterns[type] || patterns.habits;

  return (
    <div className="inline-grid gap-[1px]" style={{ gridTemplateColumns: 'repeat(5, 2px)' }}>
      {pattern.flat().map((on, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 2,
            height: 2,
            background: on ? 'var(--text-primary)' : 'transparent',
          }}
        />
      ))}
    </div>
  );
}

export default App;
