import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { formatTime } from '../utils';

export default function PlayerPage() {
  const {
    tracks, queue, currentTrackId, isPlaying, favorites,
    playTrack, togglePlay, toggleFavorite, setQueue,
  } = useStore();

  const [showQueue, setShowQueue] = useState(false);
  const [showFX, setShowFX] = useState(false);
  const [slowed, setSlowed] = useState(1.0);
  const [reverb, setReverb] = useState(0);
  const [eq, setEq] = useState([0, 0, 0, 0, 0]); // 5 полос
  const [progress, setProgress] = useState(0);
  const [currentGif, setCurrentGif] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTrack = tracks.find((t) => t.id === currentTrackId);
  const isFav = currentTrackId ? favorites.includes(currentTrackId) : false;

  // Симуляция прогресса
  useEffect(() => {
    if (isPlaying && currentTrack) {
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= currentTrack.duration) {
            // Следующий трек
            const idx = queue.indexOf(currentTrack.id);
            const next = queue[(idx + 1) % queue.length];
            if (next) playTrack(next);
            return 0;
          }
          return p + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, currentTrack, queue, playTrack]);

  const handlePrev = () => {
    if (!currentTrackId) return;
    const idx = queue.indexOf(currentTrackId);
    const prev = queue[(idx - 1 + queue.length) % queue.length];
    if (prev) { playTrack(prev); setProgress(0); }
  };

  const handleNext = () => {
    if (!currentTrackId) return;
    const idx = queue.indexOf(currentTrackId);
    const next = queue[(idx + 1) % queue.length];
    if (next) { playTrack(next); setProgress(0); }
  };

  const handleLike = () => {
    if (currentTrackId) {
      toggleFavorite(currentTrackId);
    }
  };

  // GIFs (заглушки — цвета)
  const gifColors = [
    'from-red-900/40 to-black',
    'from-purple-900/40 to-black',
    'from-blue-900/40 to-black',
    'from-green-900/40 to-black',
    'from-orange-900/40 to-black',
  ];

  return (
    <div className="page-enter h-full overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">ПЛЕЕР</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Локальная музыка</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Обложка в светящемся контуре */}
        <div className="relative mb-8">
          <div
            className="w-full aspect-square rounded-2xl overflow-hidden relative"
            style={{
              boxShadow: isPlaying
                ? '0 0 40px rgba(215, 25, 33, 0.3), 0 0 80px rgba(215, 25, 33, 0.1), inset 0 0 60px rgba(0,0,0,0.5)'
                : '0 0 20px rgba(255,255,255,0.05), inset 0 0 40px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {/* Фон обложки — dot-matrix паттерн */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gifColors[currentGif % gifColors.length]} transition-all duration-700`} />
            <div className="absolute inset-0 dot-pattern opacity-20" />

            {/* Декоративные линии */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-3/4 border border-white/5 rounded-xl" />
              <div className="absolute w-1/2 h-1/2 border border-white/5 rounded-lg rotate-45" />
            </div>

            {/* GIF-оверлей (симуляция визуализации) */}
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="rounded-full"
                  style={{
                    width: '40%',
                    height: '40%',
                    background: 'radial-gradient(circle, var(--accent) 0%, rgba(215,25,33,0.3) 40%, transparent 70%)',
                    animation: `pulse ${Math.max(0.5, 2 - slowed)}s ease-in-out infinite`,
                  }}
                />
                {/* Визуализация волн */}
                <div className="absolute bottom-12 left-8 right-8 flex items-end justify-center gap-[3px] h-12">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div
                      key={i}
                      className="w-[3px] rounded-full bg-[var(--accent)]"
                      style={{
                        height: `${20 + Math.sin((Date.now() / 200 + i) * 0.5) * 30 + Math.random() * 10}%`,
                        opacity: 0.4 + Math.random() * 0.4,
                        animation: `pulse ${0.3 + Math.random() * 0.5}s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Название на обложке */}
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-lg font-semibold text-white drop-shadow-lg">
                {currentTrack?.title || 'Выберите трек'}
              </p>
              <p className="text-sm text-white/60">
                {currentTrack?.artist || '—'}
              </p>
            </div>

            {/* Клик для смены визуала */}
            <button
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/40 hover:text-white transition-colors text-sm"
              onClick={() => setCurrentGif((g) => (g + 1) % gifColors.length)}
            >
              ⟳
            </button>
          </div>
        </div>

        {/* Время */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-dot text-sm text-[var(--text-secondary)]">
            {formatTime(progress)}
          </span>
          <span className="font-dot text-sm text-[var(--text-secondary)]">
            {currentTrack ? formatTime(currentTrack.duration) : '0:00'}
          </span>
        </div>

        {/* Слайдер прогресса */}
        <div className="thin-bar mb-6 cursor-pointer" onClick={(e) => {
          if (!currentTrack) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          setProgress(Math.round(pct * currentTrack.duration));
        }}>
          <div
            className="thin-bar-fill"
            style={{ width: `${currentTrack ? Math.max(2, (progress / currentTrack.duration) * 100) : 0}%` }}
          />
        </div>

        {/* Управление */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            className="text-[var(--text-secondary)] hover:text-white transition-colors"
            onClick={() => setQueue([...queue].sort(() => Math.random() - 0.5))}
            title="Перемешать"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
          </button>
          <button className="text-[var(--text-primary)] hover:text-white transition-colors" onClick={handlePrev}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button className="play-btn" onClick={togglePlay}>
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button className="text-[var(--text-primary)] hover:text-white transition-colors" onClick={handleNext}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
          <button
            className={`transition-colors ${isFav ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
            onClick={handleLike}
            title="Нравится"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* SLOWED + REVERB панель */}
        <div className="glass-card mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="section-label">SLOWED + REVERB</span>
            <button className="text-xs text-[var(--accent)]" onClick={() => setShowFX(!showFX)}>
              {showFX ? 'СКРЫТЬ FX' : 'FX'}
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-secondary)]">Скорость</span>
                <span className="font-dot text-xs text-white">{slowed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={slowed}
                onChange={(e) => setSlowed(parseFloat(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-secondary)]">Реверб</span>
                <span className="font-dot text-xs text-white">{reverb}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={reverb}
                onChange={(e) => setReverb(parseInt(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        {/* Эквалайзер */}
        {showFX && (
          <div className="glass-card mb-4">
            <span className="section-label mb-4 block">ЭКВАЛАЙЗЕР</span>
            <div className="flex items-end justify-between gap-4 h-32">
              {['60', '250', '1K', '4K', '12K'].map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-2 flex-1">
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={eq[i]}
                    onChange={(e) => {
                      const newEq = [...eq];
                      newEq[i] = parseInt(e.target.value);
                      setEq(newEq);
                    }}
                    className="w-full accent-[var(--accent)]"
                    style={{ writingMode: 'vertical-lr' as any, height: 80 }}
                  />
                  <span className="text-[10px] text-[var(--text-disabled)]">{label}</span>
                  <span className="font-dot text-[10px] text-[var(--text-secondary)]">{eq[i] > 0 ? '+' : ''}{eq[i]}</span>
                </div>
              ))}
            </div>
            {/* Пресеты */}
            <div className="flex gap-2 mt-4">
              {['Flat', 'Bass', 'Vocal', 'Rock'].map((preset) => (
                <button
                  key={preset}
                  className="text-xs px-3 py-1 rounded-full border border-[var(--border-visible)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  onClick={() => {
                    if (preset === 'Flat') setEq([0, 0, 0, 0, 0]);
                    else if (preset === 'Bass') setEq([8, 4, 0, -2, -4]);
                    else if (preset === 'Vocal') setEq([-2, 0, 4, 2, 0]);
                    else if (preset === 'Rock') setEq([4, 2, -2, 4, 6]);
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Очередь */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <span className="section-label">ОЧЕРЕДЬ ({queue.length})</span>
            <button className="text-xs text-[var(--accent)]" onClick={() => setShowQueue(!showQueue)}>
              {showQueue ? 'СКРЫТЬ' : 'ПОКАЗАТЬ'}
            </button>
          </div>
          {showQueue && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {queue.map((id, idx) => {
                const track = tracks.find((t) => t.id === id);
                if (!track) return null;
                const isCurrent = id === currentTrackId;
                return (
                  <div
                    key={`${id}-${idx}`}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isCurrent ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30' : 'hover:bg-[var(--surface-raised)]'
                    }`}
                    onClick={() => { playTrack(id); setProgress(0); }}
                  >
                    <span className="font-dot text-xs text-[var(--text-disabled)] w-6">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-[var(--text-disabled)] truncate">{track.artist}</p>
                    </div>
                    <span className="font-dot text-xs text-[var(--text-disabled)]">{formatTime(track.duration)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
