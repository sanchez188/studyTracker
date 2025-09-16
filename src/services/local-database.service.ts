import { Injectable } from "@angular/core";
import Dexie, { Table } from "dexie";
import { BehaviorSubject, Observable, from, of } from "rxjs";
import {
  Category,
  Task,
  TimeSession,
  UserSettings,
  UserStreak,
  WeeklyReset,
  DailyMotivation,
} from "../models/study-tracker.models";

export interface ImportData {
  tasks?: Task[];
  categories?: Category[];
  date?: string;
  type: "single-day" | "full-week";
}

export class StudyTrackerDB extends Dexie {
  categories!: Table<Category>;
  tasks!: Table<Task>;
  timeSessions!: Table<TimeSession>;
  userSettings!: Table<UserSettings>;
  userStreaks!: Table<UserStreak>;
  weeklyResets!: Table<WeeklyReset>;
  dailyMotivations!: Table<DailyMotivation>;

  constructor() {
    super("StudyTrackerDB");
    this.version(1).stores({
      categories: "id, name, icon, color, weekly_goal, created_at, user_id",
      tasks:
        "++id, description, category, duration, scheduled_time, completed, completed_at, date, created_at, user_id, notes",
      timeSessions:
        "++id, task_id, category, description, duration, date, started_at, completed_at, created_at, user_id",
      userSettings:
        "user_id, sound_enabled, notifications_enabled, auto_start_next, theme, updated_at",
      userStreaks:
        "user_id, current_streak, longest_streak, last_activity_date, total_practice_days, created_at, updated_at",
      weeklyResets: "++id, user_id, reset_date, previous_stats, created_at",
      dailyMotivations: "++id, user_id, message, is_active, created_at",
    });
  }
}

@Injectable({
  providedIn: "root",
})
export class LocalDatabaseService {
  private db = new StudyTrackerDB();
  private currentUser$ = new BehaviorSubject<string>("local-user");
  private isOnline$ = new BehaviorSubject<boolean>(true);

  constructor() {
    this.initializeDefaultData();
  }

  // Devuelve la fecha de hoy en formato YYYY-MM-DD
  private getTodayString(): string {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  get user$(): Observable<string> {
    return this.currentUser$.asObservable();
  }

  get isOnline(): Observable<boolean> {
    return this.isOnline$.asObservable();
  }

  private async initializeDefaultData() {
    try {
      // Check if categories exist
      const categoriesCount = await this.db.categories.count();
      if (categoriesCount === 0) {
        await this.createDefaultCategoriesFromJson();
      }

      // Check if tasks exist
      const tasksCount = await this.db.tasks.count();
      if (tasksCount === 0) {
        await this.createDefaultTasks();
      }

      // Check if user settings exist
      const settingsCount = await this.db.userSettings.count();
      if (settingsCount === 0) {
        await this.createDefaultSettings();
      }

      // Check if user streak exists
      const streakCount = await this.db.userStreaks.count();
      if (streakCount === 0) {
        await this.createDefaultStreak();
      }

      // Check if default motivations exist
      const motivationsCount = await this.db.dailyMotivations.count();
      if (motivationsCount === 0) {
        await this.createDefaultMotivations();
      }
    } catch (error) {
      console.error("Error initializing default data:", error);
    }
  }

  // Inserta tareas por defecto si la tabla está vacía
  private async createDefaultTasks() {
    const today = this.getTodayString();
    const defaultTasks = [
      {
        description: "Escalas con cambio de posición",
        category: "viola",
        duration: 10,
        scheduled_time: "06:30",
        completed: false,
        date: today,
        created_at: new Date().toISOString(),
        user_id: "local-user",
      },
      {
        description: "Técnica específica o repertorio",
        category: "viola",
        duration: 15,
        scheduled_time: "06:40",
        completed: false,
        date: today,
        created_at: new Date().toISOString(),
        user_id: "local-user",
      },
      {
        description: "Lectura a primera vista",
        category: "viola",
        duration: 5,
        scheduled_time: "06:55",
        completed: false,
        date: today,
        created_at: new Date().toISOString(),
        user_id: "local-user",
      },
      {
        description: "Módulos AZ-204 WhizLabs",
        category: "az204",
        duration: 30,
        scheduled_time: "07:00",
        completed: false,
        date: today,
        created_at: new Date().toISOString(),
        user_id: "local-user",
      },
      {
        description: "Laboratorio práctico Azure",
        category: "az204",
        duration: 45,
        scheduled_time: "20:00",
        completed: false,
        date: today,
        created_at: new Date().toISOString(),
        user_id: "local-user",
      },
      {
        description: "Lectura dirección orquestal",
        category: "conducting",
        duration: 20,
        scheduled_time: "20:45",
        completed: false,
        date: today,
        created_at: new Date().toISOString(),
        user_id: "local-user",
      },
    ];
    await this.db.tasks.bulkAdd(defaultTasks as any);
  }

  // Inserta categorías por defecto desde el JSON proporcionado
  private async createDefaultCategoriesFromJson() {
    const defaultCategoriesJson = [
      {
        idx: 0,
        id: "az204",
        name: "AZ-204",
        icon: "💻",
        color: "#3498db",
        weekly_goal: 5,
        created_at: "2025-09-16 16:22:57.590532+00",
        user_id: null,
      },
      {
        idx: 1,
        id: "conducting",
        name: "Dirección",
        icon: "🎼",
        color: "#2ecc71",
        weekly_goal: 2,
        created_at: "2025-09-16 16:22:57.590532+00",
        user_id: null,
      },
      {
        idx: 2,
        id: "ear_training",
        name: "Entrenamiento Auditivo",
        icon: "👂",
        color: "#f39c12",
        weekly_goal: 1,
        created_at: "2025-09-16 16:23:40.004774+00",
        user_id: null,
      },
      {
        idx: 3,
        id: "music_theory",
        name: "Teoría Musical",
        icon: "🎵",
        color: "#9b59b6",
        weekly_goal: 2,
        created_at: "2025-09-16 16:23:40.004774+00",
        user_id: null,
      },
      {
        idx: 4,
        id: "viola",
        name: "Viola",
        icon: "🎻",
        color: "#e74c3c",
        weekly_goal: 3,
        created_at: "2025-09-16 16:22:57.590532+00",
        user_id: null,
      },
    ];

    const categories = defaultCategoriesJson.map((item) => ({
      id: item.id,
      name: item.name,
      icon: item.icon,
      color: item.color,
      weekly_goal: item.weekly_goal,
      created_at: item.created_at,
      user_id: item.user_id ?? "local-user",
    }));

    await this.db.categories.bulkAdd(categories);
  }

  private async createDefaultSettings() {
    const defaultSettings: UserSettings = {
      user_id: "local-user",
      sound_enabled: true,
      notifications_enabled: true,
      auto_start_next: false,
      theme: "default",
      updated_at: new Date().toISOString(),
    };

    await this.db.userSettings.add(defaultSettings);
  }

  private async createDefaultStreak() {
    const defaultStreak: UserStreak = {
      user_id: "local-user",
      current_streak: 0,
      longest_streak: 0,
      total_practice_days: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.db.userStreaks.add(defaultStreak);
  }

  private async createDefaultMotivations() {
    const defaultMotivations = [
      "🎯 Cada pequeño paso te acerca más a tu meta. ¡Hoy es un gran día para practicar!",
      "🎼 La música y la tecnología se combinan en ti. ¡Eres único y talentoso!",
      "💪 A los 33 años tienes la experiencia y la determinación. ¡Es tu momento!",
      "🎻 Cada escala que practicas te hace mejor músico. ¡La constancia es clave!",
      "☁️ Azure espera por ti. Cada concepto aprendido te acerca a la certificación.",
      "🎵 Dirigir esa orquesta de niños es inspirador. ¡Estás marcando vidas!",
      "🌟 Balancear familia, trabajo y sueños no es fácil, pero lo estás logrando.",
      "🔥 Tu racha de constancia está creciendo. ¡No la rompas hoy!",
      "🎯 Pequeños momentos, grandes resultados. ¡Cada minuto cuenta!",
      "💫 Eres un ejemplo de perseverancia. ¡Tus hijas estarán orgullosas!",
    ];

    const motivations = defaultMotivations.map((message) => ({
      user_id: "local-user",
      message,
      is_active: true,
      created_at: new Date().toISOString(),
    }));

    await this.db.dailyMotivations.bulkAdd(motivations as DailyMotivation[]);
  }

  // Categories
  getCategories(): Observable<Category[]> {
    return from(
      this.db.categories.where("user_id").equals("local-user").toArray()
    );
  }

  createCategory(
    category: Omit<Category, "created_at" | "user_id">
  ): Observable<Category> {
    const newCategory: Category = {
      ...category,
      created_at: new Date().toISOString(),
      user_id: "local-user",
    };

    return from(this.db.categories.add(newCategory).then(() => newCategory));
  }

  // Tasks
  getTasks(date?: string): Observable<Task[]> {
    let query = this.db.tasks.where("user_id").equals("local-user");

    if (date) {
      return from(query.and((task) => task.date === date).toArray());
    }

    return from(query.toArray());
  }

  createTask(
    task: Omit<Task, "id" | "created_at" | "user_id">
  ): Observable<Task> {
    const newTask: Omit<Task, "id"> = {
      ...task,
      created_at: new Date().toISOString(),
      user_id: "local-user",
    };

    return from(
      this.db.tasks
        .add(newTask as Task)
        .then((id) => ({ ...newTask, id } as Task))
    );
  }

  updateTask(id: number, updates: Partial<Task>): Observable<Task> {
    return from(
      this.db.tasks
        .update(id, updates)
        .then(() => this.db.tasks.get(id).then((task) => task as Task))
    );
  }

  deleteTask(id: number): Observable<void> {
    return from(this.db.tasks.delete(id));
  }

  // Weekly view methods
  async getWeeklyTasks(startDate: string): Promise<Task[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const endDateStr = endDate.toISOString().split("T")[0];

    return this.db.tasks
      .where("user_id")
      .equals("local-user")
      .and((task) => task.date >= startDate && task.date <= endDateStr)
      .toArray();
  }

  // Import JSON data
  async importFromJson(
    jsonData: ImportData
  ): Promise<{ success: boolean; message: string; imported: number }> {
    try {
      let importedCount = 0;

      if (jsonData.categories && jsonData.categories.length > 0) {
        // Import categories first
        for (const category of jsonData.categories) {
          const existingCategory = await this.db.categories
            .where("id")
            .equals(category.id)
            .first();

          if (!existingCategory) {
            await this.db.categories.add({
              ...category,
              user_id: "local-user",
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      if (jsonData.tasks && jsonData.tasks.length > 0) {
        for (const taskData of jsonData.tasks) {
          // Validate required fields
          if (
            !taskData.description ||
            !taskData.category ||
            !taskData.duration
          ) {
            continue;
          }

          // Set date based on import type
          let taskDate = taskData.date;
          if (jsonData.type === "single-day" && jsonData.date) {
            taskDate = jsonData.date;
          }

          const task = {
            description: taskData.description,
            category: taskData.category,
            duration: taskData.duration,
            scheduled_time: taskData.scheduled_time || "",
            completed: taskData.completed || false,
            completed_at: taskData.completed_at,
            date: taskDate || new Date().toISOString().split("T")[0],
            created_at: new Date().toISOString(),
            user_id: "local-user",
            notes: taskData.notes || "",
          };

          await this.db.tasks.add(task as Task);
          importedCount++;
        }
      }

      return {
        success: true,
        message: `Se importaron ${importedCount} tareas exitosamente`,
        imported: importedCount,
      };
    } catch (error) {
      console.error("Error importing JSON:", error);
      return {
        success: false,
        message: "Error al importar datos: " + (error as Error).message,
        imported: 0,
      };
    }
  }

  // Generate week template for export
  generateWeekTemplate(): ImportData {
    const today = new Date();
    const monday = new Date(today);
    // Obtener el lunes de la semana actual
    // getDay() devuelve 0=Domingo, 1=Lunes, 2=Martes, etc.
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : 1 - dayOfWeek; // Si es domingo, avanzar 1 día
    monday.setDate(today.getDate() + daysToMonday);

    const weekTasks: Task[] = [];
    const days = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      // Add sample tasks for each day
      weekTasks.push(
        {
          id: 0,
          description: `Práctica matutina - ${days[i]}`,
          category: "viola",
          duration: 30,
          scheduled_time: "07:00",
          completed: false,
          date: dateStr,
          created_at: new Date().toISOString(),
          user_id: "local-user",
        },
        {
          id: 0,
          description: `Estudio AZ-204 - ${days[i]}`,
          category: "az204",
          duration: 45,
          scheduled_time: "20:00",
          completed: false,
          date: dateStr,
          created_at: new Date().toISOString(),
          user_id: "local-user",
        }
      );
    }

    return {
      type: "full-week",
      tasks: weekTasks,
    };
  }

  // Time Sessions
  createTimeSession(
    session: Omit<TimeSession, "id" | "created_at" | "user_id">
  ): Observable<TimeSession> {
    const newSession: Omit<TimeSession, "id"> = {
      ...session,
      created_at: new Date().toISOString(),
      user_id: "local-user",
    };

    return from(
      this.db.timeSessions
        .add(newSession as TimeSession)
        .then((id) => ({ ...newSession, id } as TimeSession))
    );
  }

  getWeeklyStats(): Observable<Record<string, number>> {
    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + daysToMonday); // Monday
    const startDate = startOfWeek.toISOString().split("T")[0];

    return from(
      this.db.timeSessions
        .where("user_id")
        .equals("local-user")
        .and((session) => session.date >= startDate)
        .toArray()
        .then((sessions) => {
          const stats: Record<string, number> = {};
          sessions.forEach((session) => {
            stats[session.category] =
              (stats[session.category] || 0) + session.duration;
          });
          return stats;
        })
    );
  }

  // User Settings
  getUserSettings(): Observable<UserSettings> {
    return from(
      this.db.userSettings.get("local-user").then(
        (settings) =>
          settings || {
            user_id: "local-user",
            sound_enabled: true,
            notifications_enabled: true,
            auto_start_next: false,
            theme: "default" as "default",
            updated_at: new Date().toISOString(),
          }
      )
    );
  }

  updateUserSettings(
    settings: Partial<UserSettings>
  ): Observable<UserSettings> {
    return from(
      this.db.userSettings.get("local-user").then((existing) => {
        const merged: UserSettings = {
          user_id: "local-user",
          sound_enabled:
            settings.sound_enabled ?? existing?.sound_enabled ?? true,
          notifications_enabled:
            settings.notifications_enabled ??
            existing?.notifications_enabled ??
            true,
          auto_start_next:
            settings.auto_start_next ?? existing?.auto_start_next ?? false,
          theme: settings.theme ?? existing?.theme ?? "default",
          updated_at: new Date().toISOString(),
        };
        return this.db.userSettings.put(merged).then(() => merged);
      })
    );
  }

  // User Streaks
  getUserStreak(): Observable<UserStreak> {
    return from(
      this.db.userStreaks.get("local-user").then(
        (streak) =>
          streak || {
            user_id: "local-user",
            current_streak: 0,
            longest_streak: 0,
            total_practice_days: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
      )
    );
  }

  async updateUserStreak(): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Check if user has completed tasks today
    const todayTasks = await this.db.tasks
      .where("user_id")
      .equals("local-user")
      .and((task) => task.date === today && task.completed)
      .toArray();

    if (todayTasks.length === 0) return;

    const currentStreak = await this.db.userStreaks.get("local-user");
    if (!currentStreak) return;

    let newStreak = currentStreak.current_streak;
    let newLongest = currentStreak.longest_streak;
    let newTotalDays = currentStreak.total_practice_days;

    // If last activity was yesterday, increment streak
    if (currentStreak.last_activity_date === yesterdayStr) {
      newStreak++;
    } else if (currentStreak.last_activity_date !== today) {
      // If last activity was not today and not yesterday, reset streak
      newStreak = 1;
    }

    // Update longest streak if current is higher
    if (newStreak > newLongest) {
      newLongest = newStreak;
    }

    // Increment total practice days if this is a new day
    if (currentStreak.last_activity_date !== today) {
      newTotalDays++;
    }

    await this.db.userStreaks.update("local-user", {
      current_streak: newStreak,
      longest_streak: newLongest,
      total_practice_days: newTotalDays,
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    });
  }

  // Weekly Reset
  async resetWeeklyProgress(): Promise<void> {
    // Get current weekly stats
    const currentStats = await this.getWeeklyStats().toPromise();

    // Save current stats to weekly resets
    const resetRecord = {
      user_id: "local-user",
      reset_date: new Date().toISOString().split("T")[0],
      previous_stats: currentStats,
      created_at: new Date().toISOString(),
    };

    await this.db.weeklyResets
      .add(resetRecord as WeeklyReset)
      .then((id) => ({ ...resetRecord, id } as WeeklyReset));

    // Delete time sessions from this week
    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + daysToMonday);
    const startDate = startOfWeek.toISOString().split("T")[0];

    await this.db.timeSessions
      .where("user_id")
      .equals("local-user")
      .and((session) => session.date >= startDate)
      .delete();
  }

  // Daily Motivations
  getDailyMotivation(): Observable<string> {
    return from(
      this.db.dailyMotivations
        .where("user_id")
        .equals("local-user")
        .and((motivation) => motivation.is_active)
        .toArray()
        .then((motivations) => {
          if (motivations.length === 0) {
            return "🎯 ¡Hoy es un gran día para practicar!";
          }
          const today = new Date().getDate();
          return motivations[today % motivations.length].message;
        })
    );
  }

  addCustomMotivation(message: string): Observable<DailyMotivation> {
    const newMotivation = {
      user_id: "local-user",
      message,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    return from(
      this.db.dailyMotivations
        .add(newMotivation as DailyMotivation)
        .then((id) => ({ ...newMotivation, id } as DailyMotivation))
    );
  }

  getCustomMotivations(): Observable<DailyMotivation[]> {
    return from(
      this.db.dailyMotivations.where("user_id").equals("local-user").toArray()
    );
  }

  deleteMotivation(id: number): Observable<void> {
    return from(this.db.dailyMotivations.delete(id));
  }

  // Auto weekly reset check
  async checkAndResetWeekly(): Promise<void> {
    const today = new Date();
    const isMonday = today.getDay() === 1;

    if (!isMonday) return;

    // Check if we already reset this week
    const mondayDate = today.toISOString().split("T")[0];
    const existingReset = await this.db.weeklyResets
      .where("user_id")
      .equals("local-user")
      .and((reset) => reset.reset_date === mondayDate)
      .first();

    if (!existingReset) {
      await this.resetWeeklyProgress();
    }
  }
}
