import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

// ═══════════════════════════════════════════
// ТИПЫ ДАННЫХ (модель из 1.6)
// ═══════════════════════════════════════════

export interface Habit {
  id: string;
  title: string;
  note: string;
  reminderTimeMinutes: number | null;
  createdAt: number;
}

export interface HabitCompletion {
  habitId: string;
  dayEpoch: number; // начало дня в секундах
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amountMinor: number; // в копейках
  categoryId: string;
  note: string;
  dateMillis: number;
  creditId?: string;
  recurring?: boolean;
}

export interface Category {
  id: string;
  name: string;
  budgetMinor?: number; // месячный лимит
}

export interface Credit {
  id: string;
  title: string;
  monthlyPaymentMinor: number;
  paymentDay: number; // день месяца
  note: string;
  totalMonths: number;
  startDate: string; // YYYY-MM
}

export interface CreditPayment {
  creditId: string;
  yearMonth: string; // YYYY-MM
}

export interface Course {
  id: string;
  title: string;
  note: string;
  startDate: string; // YYYY-MM-DD
  totalDays: number;
  intervalHours: number;
  intervalMinutes: number;
  firstDoseMinutes: number; // минуты от начала дня
}

export interface DoseMark {
  courseId: string;
  dayEpoch: number;
  doseMinutes: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // секунды
  path: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

export interface Settings {
  theme: 'dark' | 'light' | 'system';
  language: 'ru' | 'en';
  notifications: boolean;
  glyph: boolean;
  iconSet: 'lines' | 'dots';
  musicFolders: string[];
  autoStart: boolean;
}

// ═══════════════════════════════════════════
// SNACKBAR
// ═══════════════════════════════════════════

export interface SnackbarData {
  id: string;
  message: string;
  onUndo?: () => void;
  timeout?: number;
}

// ═══════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════

type Page = 'habits' | 'finances' | 'credits' | 'player' | 'settings';

interface ZedState {
  // Навигация
  currentPage: Page;
  setPage: (page: Page) => void;

  // Настройки
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;

  // Привычки
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  addHabit: (h: Omit<Habit, 'id' | 'createdAt'>) => void;
  updateHabit: (id: string, h: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitToday: (habitId: string) => void;

  // Финансы
  transactions: Transaction[];
  categories: Category[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;

  // Кредиты
  credits: Credit[];
  creditPayments: CreditPayment[];
  addCredit: (c: Omit<Credit, 'id'>) => void;
  deleteCredit: (id: string) => void;
  toggleCreditPayment: (creditId: string, yearMonth: string) => void;

  // Курсы
  courses: Course[];
  doseMarks: DoseMark[];
  addCourse: (c: Omit<Course, 'id'>) => void;
  deleteCourse: (id: string) => void;
  markDose: (courseId: string, dayEpoch: number, doseMinutes: number) => void;

  // Плеер
  tracks: Track[];
  playlists: Playlist[];
  favorites: string[];
  currentTrackId: string | null;
  isPlaying: boolean;
  queue: string[];
  setQueue: (ids: string[]) => void;
  playTrack: (id: string) => void;
  togglePlay: () => void;
  toggleFavorite: (id: string) => void;

  // Снекбар
  snackbar: SnackbarData | null;
  showSnackbar: (msg: string, onUndo?: () => void) => void;
  hideSnackbar: () => void;
}

// Утилита: начало дня в секундах (epoch)
export function dayStartEpoch(date: Date = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

// Утилита: текущий YYYY-MM
export function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Стандартные категории
const defaultCategories: Category[] = [
  { id: 'food', name: 'Еда' },
  { id: 'transport', name: 'Транспорт' },
  { id: 'health', name: 'Здоровье' },
  { id: 'entertainment', name: 'Развлечения' },
  { id: 'utilities', name: 'Коммуналка' },
  { id: 'other', name: 'Другое' },
];

// Демо-треки (заглушки для плеера)
const demoTracks: Track[] = [
  { id: 't1', title: 'Midnight Signal', artist: 'ZED', duration: 213, path: '' },
  { id: 't2', title: 'Dot Matrix Dreams', artist: 'ZED', duration: 187, path: '' },
  { id: 't3', title: 'Glyph Pulse', artist: 'ZED', duration: 245, path: '' },
  { id: 't4', title: 'Nothing Personal', artist: 'ZED', duration: 198, path: '' },
  { id: 't5', title: 'Retrograde', artist: 'ZED', duration: 267, path: '' },
];

// Демо-данные для первого запуска
const today = dayStartEpoch();
const yesterday = today - 86400;
const twoDaysAgo = today - 86400 * 2;
const threeDaysAgo = today - 86400 * 3;

const demoHabits: Habit[] = [
  { id: 'h1', title: 'Медитация', note: '10 минут утром', reminderTimeMinutes: 480, createdAt: Date.now() - 86400000 * 30 },
  { id: 'h2', title: 'Чтение', note: '30 страниц', reminderTimeMinutes: 1320, createdAt: Date.now() - 86400000 * 20 },
  { id: 'h3', title: 'Тренировка', note: 'Силовая / кардио', reminderTimeMinutes: 1080, createdAt: Date.now() - 86400000 * 15 },
  { id: 'h4', title: 'Вода 2л', note: '', reminderTimeMinutes: null, createdAt: Date.now() - 86400000 * 10 },
];

const demoCompletions: HabitCompletion[] = [
  { habitId: 'h1', dayEpoch: today },
  { habitId: 'h1', dayEpoch: yesterday },
  { habitId: 'h1', dayEpoch: twoDaysAgo },
  { habitId: 'h1', dayEpoch: threeDaysAgo },
  { habitId: 'h2', dayEpoch: today },
  { habitId: 'h2', dayEpoch: yesterday },
  { habitId: 'h3', dayEpoch: yesterday },
  { habitId: 'h3', dayEpoch: threeDaysAgo },
  { habitId: 'h4', dayEpoch: today },
  { habitId: 'h4', dayEpoch: yesterday },
  { habitId: 'h4', dayEpoch: twoDaysAgo },
];

const now = new Date();
const demoTransactions: Transaction[] = [
  { id: 'tx1', type: 'INCOME', amountMinor: 8500000, categoryId: 'other', note: 'Зарплата', dateMillis: new Date(now.getFullYear(), now.getMonth(), 5).getTime() },
  { id: 'tx2', type: 'EXPENSE', amountMinor: 45000, categoryId: 'food', note: 'Продукты', dateMillis: new Date(now.getFullYear(), now.getMonth(), 8).getTime() },
  { id: 'tx3', type: 'EXPENSE', amountMinor: 120000, categoryId: 'utilities', note: 'Электричество', dateMillis: new Date(now.getFullYear(), now.getMonth(), 10).getTime() },
  { id: 'tx4', type: 'EXPENSE', amountMinor: 35000, categoryId: 'transport', note: 'Метро', dateMillis: new Date(now.getFullYear(), now.getMonth(), 12).getTime() },
  { id: 'tx5', type: 'EXPENSE', amountMinor: 89000, categoryId: 'entertainment', note: 'Концерт', dateMillis: new Date(now.getFullYear(), now.getMonth(), 14).getTime() },
  { id: 'tx6', type: 'EXPENSE', amountMinor: 25000, categoryId: 'food', note: 'Кафе', dateMillis: new Date(now.getFullYear(), now.getMonth(), 15).getTime() },
  { id: 'tx7', type: 'EXPENSE', amountMinor: 150000, categoryId: 'health', note: 'Врач', dateMillis: new Date(now.getFullYear(), now.getMonth(), 3).getTime() },
];

const demoCredits: Credit[] = [
  { id: 'cr1', title: 'Ипотека', monthlyPaymentMinor: 4500000, paymentDay: 15, note: 'Квартира', totalMonths: 240, startDate: '2024-01' },
  { id: 'cr2', title: 'Автокредит', monthlyPaymentMinor: 2800000, paymentDay: 20, note: '', totalMonths: 36, startDate: '2024-06' },
];

const demoCreditPayments: CreditPayment[] = [
  { creditId: 'cr1', yearMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` },
];

const demoCourses: Course[] = [
  { id: 'c1', title: 'Витамин D', note: '2000 МЕ', startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), totalDays: 30, intervalHours: 24, intervalMinutes: 0, firstDoseMinutes: 480 },
];

export const useStore = create<ZedState>()(
  persist(
    (set, get) => ({
      // Навигация
      currentPage: 'habits',
      setPage: (page) => set({ currentPage: page }),

      // Настройки
      settings: {
        theme: 'dark',
        language: 'ru',
        notifications: true,
        glyph: true,
        iconSet: 'lines',
        musicFolders: [],
        autoStart: false,
      },
      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),

      // Привычки
      habits: demoHabits,
      habitCompletions: demoCompletions,
      addHabit: (h) =>
        set((state) => ({
          habits: [...state.habits, { ...h, id: uuid(), createdAt: Date.now() }],
        })),
      updateHabit: (id, h) =>
        set((state) => ({
          habits: state.habits.map((hab) =>
            hab.id === id ? { ...hab, ...h } : hab
          ),
        })),
      deleteHabit: (id) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === id);
        const completions = state.habitCompletions.filter((c) => c.habitId === id);
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
          habitCompletions: s.habitCompletions.filter((c) => c.habitId !== id),
        }));
        if (habit) {
          get().showSnackbar(`«${habit.title}» удалено`, () => {
            set((s) => ({
              habits: [...s.habits, habit],
              habitCompletions: [...s.habitCompletions, ...completions],
            }));
          });
        }
      },
      toggleHabitToday: (habitId) => {
        const today = dayStartEpoch();
        set((state) => {
          const exists = state.habitCompletions.find(
            (c) => c.habitId === habitId && c.dayEpoch === today
          );
          if (exists) {
            return {
              habitCompletions: state.habitCompletions.filter(
                (c) => !(c.habitId === habitId && c.dayEpoch === today)
              ),
            };
          }
          return {
            habitCompletions: [
              ...state.habitCompletions,
              { habitId, dayEpoch: today },
            ],
          };
        });
      },

      // Финансы
      transactions: demoTransactions,
      categories: defaultCategories,
      addTransaction: (t) =>
        set((state) => ({
          transactions: [...state.transactions, { ...t, id: uuid() }],
        })),
      deleteTransaction: (id) => {
        const state = get();
        const tx = state.transactions.find((t) => t.id === id);
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        }));
        if (tx) {
          get().showSnackbar('Транзакция удалена', () => {
            set((s) => ({ transactions: [...s.transactions, tx] }));
          });
        }
      },
      addCategory: (name) =>
        set((state) => ({
          categories: [...state.categories, { id: uuid(), name }],
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      // Кредиты
      credits: demoCredits,
      creditPayments: demoCreditPayments,
      addCredit: (c) =>
        set((state) => ({
          credits: [...state.credits, { ...c, id: uuid() }],
        })),
      deleteCredit: (id) => {
        const state = get();
        const credit = state.credits.find((c) => c.id === id);
        const payments = state.creditPayments.filter((p) => p.creditId === id);
        const txs = state.transactions.filter((t) => t.creditId === id);
        set((s) => ({
          credits: s.credits.filter((c) => c.id !== id),
          creditPayments: s.creditPayments.filter((p) => p.creditId !== id),
          transactions: s.transactions.filter((t) => t.creditId !== id),
        }));
        if (credit) {
          get().showSnackbar(`«${credit.title}» удалён`, () => {
            set((s) => ({
              credits: [...s.credits, credit],
              creditPayments: [...s.creditPayments, ...payments],
              transactions: [...s.transactions, ...txs],
            }));
          });
        }
      },
      toggleCreditPayment: (creditId, yearMonth) => {
        set((state) => {
          const exists = state.creditPayments.find(
            (p) => p.creditId === creditId && p.yearMonth === yearMonth
          );
          if (exists) {
            // Снимаем оплату — удаляем и автотранзакцию
            return {
              creditPayments: state.creditPayments.filter(
                (p) => !(p.creditId === creditId && p.yearMonth === yearMonth)
              ),
              transactions: state.transactions.filter(
                (t) => !(t.creditId === creditId && t.dateMillis && new Date(t.dateMillis).toISOString().slice(0, 7) === yearMonth && t.note?.includes('авто'))
              ),
            };
          }
          // Добавляем оплату + автотранзакцию
          const credit = state.credits.find((c) => c.id === creditId);
          if (!credit) return state;
          const [y, m] = yearMonth.split('-').map(Number);
          const dateMillis = new Date(y, m - 1, credit.paymentDay).getTime();
          return {
            creditPayments: [
              ...state.creditPayments,
              { creditId, yearMonth },
            ],
            transactions: [
              ...state.transactions,
              {
                id: uuid(),
                type: 'EXPENSE',
                amountMinor: credit.monthlyPaymentMinor,
                categoryId: 'utilities',
                note: `авто: ${credit.title}`,
                dateMillis,
                creditId,
              },
            ],
          };
        });
      },

      // Курсы
      courses: demoCourses,
      doseMarks: [],
      addCourse: (c) =>
        set((state) => ({
          courses: [...state.courses, { ...c, id: uuid() }],
        })),
      deleteCourse: (id) => {
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== id),
          doseMarks: state.doseMarks.filter((d) => d.courseId !== id),
        }));
      },
      markDose: (courseId, dayEpoch, doseMinutes) =>
        set((state) => ({
          doseMarks: [
            ...state.doseMarks,
            { courseId, dayEpoch, doseMinutes },
          ],
        })),

      // Плеер
      tracks: demoTracks,
      playlists: [],
      favorites: [],
      currentTrackId: null,
      isPlaying: false,
      queue: demoTracks.map((t) => t.id),
      setQueue: (ids) => set({ queue: ids }),
      playTrack: (id) => set({ currentTrackId: id, isPlaying: true }),
      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((f) => f !== id)
            : [...state.favorites, id],
        })),

      // Снекбар
      snackbar: null,
      showSnackbar: (msg, onUndo) => {
        const id = uuid();
        set({ snackbar: { id, message: msg, onUndo } });
        setTimeout(() => {
          if (get().snackbar?.id === id) {
            set({ snackbar: null });
          }
        }, 5000);
      },
      hideSnackbar: () => set({ snackbar: null }),
    }),
    {
      name: 'zed-desktop-storage',
      partialize: (state) => ({
        habits: state.habits,
        habitCompletions: state.habitCompletions,
        transactions: state.transactions,
        categories: state.categories,
        credits: state.credits,
        creditPayments: state.creditPayments,
        courses: state.courses,
        doseMarks: state.doseMarks,
        playlists: state.playlists,
        favorites: state.favorites,
        settings: state.settings,
        tracks: state.tracks,
        queue: state.queue,
      }),
      merge: (persistedState, currentState) => {
        // При первом запуске (нет данных) — используем демо-данные из currentState
        if (!persistedState || Object.keys(persistedState).length === 0) {
          return currentState as any;
        }
        return { ...(currentState as any), ...(persistedState as any) };
      },
    }
  )
);
