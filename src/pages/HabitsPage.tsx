import { useState } from 'react';
import { useStore, dayStartEpoch } from '../store';
import { getStreak, getLastNDays, getTodayProgress, getCourseDay, getNextDose } from '../utils';

export default function HabitsPage() {
  const {
    habits, habitCompletions, addHabit, updateHabit, deleteHabit,
    toggleHabitToday, courses, deleteCourse, addCourse,
  } = useStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showCourses, setShowCourses] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDays, setNewCourseDays] = useState(7);
  const [newCourseIntervalH, setNewCourseIntervalH] = useState(2);
  const [newCourseIntervalM, setNewCourseIntervalM] = useState(30);
  const [newCourseFirstDose, setNewCourseFirstDose] = useState('08:00');

  const today = dayStartEpoch();
  const last7 = getLastNDays(7);
  const progress = getTodayProgress(habits, habitCompletions);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addHabit({ title: newTitle.trim(), note: newNote.trim(), reminderTimeMinutes: null });
    setNewTitle('');
    setNewNote('');
    setShowAdd(false);
  };

  const handleAddCourse = () => {
    if (!newCourseTitle.trim()) return;
    const [h, m] = newCourseFirstDose.split(':').map(Number);
    const today = new Date().toISOString().slice(0, 10);
    addCourse({
      title: newCourseTitle.trim(),
      note: '',
      startDate: today,
      totalDays: newCourseDays,
      intervalHours: newCourseIntervalH,
      intervalMinutes: newCourseIntervalM,
      firstDoseMinutes: h * 60 + m,
    });
    setNewCourseTitle('');
    setShowCourses(false);
  };

  return (
    <div className="page-enter h-full overflow-y-auto p-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">ПРИВЫЧКИ</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Ежедневный контроль</p>
        </div>
        <button className="fab" onClick={() => setShowAdd(true)}>+</button>
      </div>

      {/* TODAY карточка */}
      <div className="glass-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="section-label">СЕГОДНЯ</span>
          <span className="font-dot text-2xl text-white">{progress}%</span>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="thin-bar flex-1">
            <div className="thin-bar-fill" style={{ width: `${Math.max(2, progress)}%` }} />
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-dot">ВЫПОЛНЕНО</span>
        </div>
        {/* 7 точек недели */}
        <div className="dot-grid">
          {last7.map((day) => {
            const dayCompletions = habitCompletions.filter((c) => c.dayEpoch === day);
            const allDone = habits.length > 0 && dayCompletions.length >= habits.length;
            const someDone = dayCompletions.length > 0;
            return (
              <div
                key={day}
                className={`dot ${allDone ? 'active' : someDone ? 'success' : ''}`}
                style={{ width: 8, height: 8 }}
              />
            );
          })}
        </div>
      </div>

      {/* Входы: КУРСЫ и СТАТИСТИКА */}
      <div className="flex gap-3 mb-6">
        <button
          className="glass-card flex-1 text-left hover:border-[var(--accent)] transition-colors cursor-pointer"
          onClick={() => setShowCourses(!showCourses)}
        >
          <span className="section-label">КУРСЫ</span>
          {courses.length > 0 && (
            <div className="mt-2">
              {(() => {
                const c = courses[0];
                const cd = getCourseDay(c);
                const next = getNextDose(c);
                return (
                  <p className="text-xs text-[var(--text-secondary)] font-dot mt-1">
                    ДЕНЬ {cd.day}/{cd.total} · КАЖДЫЕ {c.intervalHours}Ч {c.intervalMinutes > 0 ? `${c.intervalMinutes}М` : ''} · СЛЕД. {next || '—'}
                  </p>
                );
              })()}
            </div>
          )}
        </button>
        <button
          className="glass-card flex-1 text-left hover:border-[var(--accent)] transition-colors cursor-pointer"
          onClick={() => setShowStats(!showStats)}
        >
          <span className="section-label">СТАТИСТИКА</span>
          <p className="text-xs text-[var(--text-secondary)] font-dot mt-2">
            {habits.length > 0 ? `${getStreak(habitCompletions.filter(c => c.habitId === habits[0].id))} дн. лучший` : 'Нет данных'}
          </p>
        </button>
      </div>

      {/* Список привычек */}
      <div className="space-y-2">
        {habits.map((habit) => {
          const done = habitCompletions.some(
            (c) => c.habitId === habit.id && c.dayEpoch === today
          );
          const habitCompletions_ = habitCompletions.filter((c) => c.habitId === habit.id);
          const streak = getStreak(habitCompletions_);
          const weekDots = getLastNDays(7);

          return (
            <div
              key={habit.id}
              className="glass-card flex items-center gap-4 cursor-pointer group"
              onClick={() => setEditId(editId === habit.id ? null : habit.id)}
            >
              <div
                className={`square-checkbox ${done ? 'checked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHabitToday(habit.id);
                }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? 'text-[var(--text-disabled)] line-through' : 'text-[var(--text-primary)]'}`}>
                  {habit.title}
                </p>
                {habit.note && (
                  <p className="text-xs text-[var(--text-secondary)] truncate">{habit.note}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {streak > 0 && (
                  <span className="font-dot text-xs text-[var(--accent)]">{streak} дн.</span>
                )}
                <div className="dot-grid">
                  {weekDots.map((day) => {
                    const isDone = habitCompletions_.some((c) => c.dayEpoch === day);
                    return <div key={day} className={`dot ${isDone ? 'active' : ''}`} />;
                  })}
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-disabled)] hover:text-[var(--accent)] transition-all text-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHabit(habit.id);
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Редактор привычки */}
      {editId && (
        <div className="modal-overlay" onClick={() => setEditId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Редактировать</h3>
            <input
              className="zed-input mb-3"
              value={habits.find((h) => h.id === editId)?.title || ''}
              onChange={(e) => updateHabit(editId, { title: e.target.value })}
              placeholder="Название"
            />
            <input
              className="zed-input mb-4"
              value={habits.find((h) => h.id === editId)?.note || ''}
              onChange={(e) => updateHabit(editId, { note: e.target.value })}
              placeholder="Заметка"
            />
            <button className="zed-btn zed-btn-primary w-full" onClick={() => setEditId(null)}>
              СОХРАНИТЬ
            </button>
          </div>
        </div>
      )}

      {/* Добавить привычку */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Новая привычка</h3>
            <input
              className="zed-input mb-3"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Название"
              autoFocus
            />
            <input
              className="zed-input mb-4"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Заметка (опционально)"
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

      {/* Курсы */}
      {showCourses && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="section-label">КУРСЫ ПРИЁМА</span>
            <button className="text-xs text-[var(--accent)]" onClick={() => setShowCourses(false)}>
              СКРЫТЬ
            </button>
          </div>
          {courses.map((course) => {
            const cd = getCourseDay(course);
            const next = getNextDose(course);
            return (
              <div key={course.id} className="glass-card mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{course.title}</span>
                  <button
                    className="text-[var(--text-disabled)] hover:text-[var(--accent)]"
                    onClick={() => deleteCourse(course.id)}
                  >
                    ×
                  </button>
                </div>
                <p className="font-dot text-xs text-[var(--text-secondary)]">
                  ДЕНЬ {cd.day}/{cd.total} · КАЖДЫЕ {course.intervalHours}Ч {course.intervalMinutes > 0 ? `${course.intervalMinutes}М` : ''} · СЛЕД. {next || '—'}
                </p>
                <div className="thin-bar mt-3">
                  <div className="thin-bar-fill" style={{ width: `${Math.max(2, (cd.day / cd.total) * 100)}%` }} />
                </div>
              </div>
            );
          })}
          {/* Добавить курс */}
          <div className="glass-card mt-3">
            <input
              className="zed-input mb-3"
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
              placeholder="Название курса"
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)]">Дней</label>
                <input
                  type="number"
                  className="zed-input"
                  value={newCourseDays}
                  onChange={(e) => setNewCourseDays(Number(e.target.value))}
                  min={1}
                  max={365}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)]">Первый приём</label>
                <input
                  type="time"
                  className="zed-input"
                  value={newCourseFirstDose}
                  onChange={(e) => setNewCourseFirstDose(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)]">Интервал (ч)</label>
                <input
                  type="number"
                  className="zed-input"
                  value={newCourseIntervalH}
                  onChange={(e) => setNewCourseIntervalH(Number(e.target.value))}
                  min={0}
                  max={24}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)]">Интервал (м)</label>
                <input
                  type="number"
                  className="zed-input"
                  value={newCourseIntervalM}
                  onChange={(e) => setNewCourseIntervalM(Number(e.target.value))}
                  min={0}
                  max={59}
                />
              </div>
            </div>
            <button className="zed-btn zed-btn-primary w-full" onClick={handleAddCourse}>
              ДОБАВИТЬ КУРС
            </button>
          </div>
        </div>
      )}

      {/* Статистика */}
      {showStats && (
        <div className="mt-6 glass-card">
          <div className="flex items-center justify-between mb-4">
            <span className="section-label">СТАТИСТИКА</span>
            <button className="text-xs text-[var(--accent)]" onClick={() => setShowStats(false)}>
              СКРЫТЬ
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="font-dot text-2xl text-white">
                {habits.length > 0 ? getStreak(habitCompletions.filter(c => c.habitId === habits[0].id)) : 0}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">7 дней</p>
            </div>
            <div className="text-center">
              <p className="font-dot text-2xl text-white">
                {habits.length > 0 ? habitCompletions.filter(c => c.habitId === habits[0].id).length : 0}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">30 дней</p>
            </div>
            <div className="text-center">
              <p className="font-dot text-2xl text-[var(--accent)]">
                {habits.length > 0 ? Math.max(...habits.map(h => getStreak(habitCompletions.filter(c => c.habitId === h.id)))) : 0}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Лучший</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
