export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  weekly_goal: number;
  created_at?: string;
  user_id?: string;
}

export interface Task {
  id: number;
  description: string;
  category: string;
  duration: number;
  scheduled_time?: string;
  completed: boolean;
  completed_at?: string;
  date: string;
  created_at?: string;
  user_id?: string;
  notes?: string;
}

export interface TimeSession {
  id: number;
  task_id?: number;
  category: string;
  description: string;
  duration: number;
  date: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  user_id?: string;
}

export interface UserSettings {
  user_id: string;
  sound_enabled: boolean;
  notifications_enabled: boolean;
  auto_start_next: boolean;
  theme: "default" | "dark" | "light";
  updated_at?: string;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  total_practice_days: number;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyReset {
  id: number;
  user_id: string;
  reset_date: string;
  previous_stats: any;
  created_at?: string;
}

export interface DailyMotivation {
  id: number;
  user_id: string;
  message: string;
  is_active: boolean;
  created_at?: string;
}

export interface TimerState {
  isRunning: boolean;
  remainingTime: number;
  totalTime: number;
  taskId?: number;
  startedAt?: Date;
}

export type StudyStats = Record<string, number>;

export interface ImportData {
  tasks?: Task[];
  categories?: Category[];
  date?: string;
  type: "single-day" | "full-week";
}

export interface WeeklyView {
  startDate: string;
  endDate: string;
  days: DayView[];
}

export interface DayView {
  date: string;
  dayName: string;
  tasks: Task[];
  totalMinutes: number;
  categoryStats: Record<string, number>;
}
