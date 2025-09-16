import { Component, OnInit, OnDestroy } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { BehaviorSubject, combineLatest, Subscription } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import { LocalDatabaseService } from "./services/local-database.service";
import { TimerService } from "./services/timer.service";
import { NotificationService } from "./services/notification.service";

import { TimerComponent } from "./components/timer/timer.component";
import { TaskListComponent } from "./components/task-list/task-list.component";
import { StatsDashboardComponent } from "./components/stats-dashboard/stats-dashboard.component";

import {
  Category,
  Task,
  StudyStats,
  UserSettings,
  UserStreak,
} from "./models/study-tracker.models";
import { WeeklyViewComponent } from "./components/weekly-view/weekly-view.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TimerComponent,
    TaskListComponent,
    StatsDashboardComponent,
    WeeklyViewComponent,
  ],
  template: `
    <div class="app-container">
      <!-- Header -->
      <header class="app-header">
        <div class="header-content">
          <h1 class="app-title">🎼 Study Tracker Pro</h1>
          <p class="app-subtitle">
            Tu compañero para el éxito musical y profesional
          </p>
        </div>
      </header>

      <!-- Notification Permission Banner -->
      <div
        class="notification-banner"
        *ngIf="(notificationPermission$ | async) === 'default'"
      >
        <div class="notification-content">
          <span class="notification-icon">🔔</span>
          <div class="notification-text">
            <strong>Activa las Notificaciones</strong>
            <p>Recibe recordatorios para mantener tu práctica constante</p>
          </div>
          <button
            class="notification-btn"
            (click)="requestNotificationPermission()"
          >
            Activar
          </button>
        </div>
      </div>

      <!-- Motivation Card -->
      <div class="motivation-card">
        <div class="motivation-text">
          {{ dailyMotivation }}
        </div>
      </div>

      <!-- Timer Section -->
      <app-timer
        [taskId]="activeTaskId"
        (timerComplete)="onTimerComplete($event)"
        (timerStarted)="onTimerStarted($event)"
        (navigateToTimer)="setActiveTab('dashboard')"
      ></app-timer>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button
          *ngFor="let tab of tabs"
          class="tab-btn"
          [class.active]="activeTab === tab.id"
          (click)="setActiveTab(tab.id)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Dashboard Tab -->
        <div *ngIf="activeTab === 'dashboard'" class="tab-pane">
          <app-stats-dashboard
            [categories]="categories"
            [weeklyStats]="weeklyStats"
            [streak]="userStreak"
          ></app-stats-dashboard>

          <app-task-list
            [tasks]="todayTasks"
            [categories]="categories"
            (taskToggle)="onTaskToggle($event)"
            (startTimer)="onStartTaskTimer($event)"
            (addTask)="onAddTask($event)"
            (deleteTask)="onDeleteTask($event)"
            (updateTask)="onUpdateTask($event)"
          ></app-task-list>
        </div>

        <!-- Category Tabs -->
        <div
          *ngIf="
            activeTab !== 'dashboard' &&
            activeTab !== 'analytics' &&
            activeTab !== 'weekly'
          "
          class="tab-pane"
        >
          <app-task-list
            [tasks]="getCategoryTasks(activeTab)"
            [categories]="categories"
            [category]="activeTab"
            (taskToggle)="onTaskToggle($event)"
            (startTimer)="onStartTaskTimer($event)"
            (addTask)="onAddTask($event)"
            (deleteTask)="onDeleteTask($event)"
            (updateTask)="onUpdateTask($event)"
          ></app-task-list>
        </div>

        <!-- Weekly View Tab -->
        <div *ngIf="activeTab === 'weekly'" class="tab-pane">
          <app-weekly-view
            [categories]="categories"
            (taskToggle)="onTaskToggle($event)"
            (startTimer)="onStartTaskTimer($event)"
            (addTask)="onAddWeeklyTask($event)"
          ></app-weekly-view>
        </div>
        <!-- Analytics Tab -->
        <div *ngIf="activeTab === 'analytics'" class="tab-pane">
          <app-stats-dashboard
            [categories]="categories"
            [weeklyStats]="weeklyStats"
            [streak]="userStreak"
          ></app-stats-dashboard>

          <!-- Additional Analytics -->
          <div class="analytics-extras">
            <div class="analytics-card">
              <h3>📈 Progreso Detallado</h3>
              <div class="progress-details">
                <div
                  *ngFor="let category of categories"
                  class="category-detail"
                >
                  <div class="category-header">
                    <span>{{ category.icon }} {{ category.name }}</span>
                    <span class="category-hours"
                      >{{ getWeeklyHours(category.id) }}h /
                      {{ category.weekly_goal }}h</span
                    >
                  </div>
                  <div class="category-progress-bar">
                    <div
                      class="progress-fill"
                      [style.width.%]="getProgressPercentage(category.id)"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="analytics-card">
              <h3>🎯 Acciones Rápidas</h3>
              <div class="quick-actions">
                <button
                  class="action-btn reset-btn"
                  (click)="resetWeeklyProgress()"
                >
                  🔄 Reiniciar Progreso Semanal
                </button>
                <button class="action-btn export-btn" (click)="exportData()">
                  📊 Exportar Datos
                </button>
                <button
                  class="action-btn motivation-btn"
                  (click)="openAddMotivationModal()"
                >
                  💭 Agregar Motivación
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Modal -->
      <div
        class="modal-overlay"
        *ngIf="showSettings"
        (click)="closeSettings($event)"
      >
        <div class="modal-content settings-modal">
          <h3>⚙️ Configuración</h3>
          <div class="settings-form">
            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  [(ngModel)]="userSettings.sound_enabled"
                  (change)="updateSettings()"
                />
                <span class="checkmark"></span>
                🔊 Sonidos de timer
              </label>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  [(ngModel)]="userSettings.notifications_enabled"
                  (change)="updateSettings()"
                />
                <span class="checkmark"></span>
                📱 Notificaciones
              </label>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  [(ngModel)]="userSettings.auto_start_next"
                  (change)="updateSettings()"
                />
                <span class="checkmark"></span>
                ⚡ Auto-iniciar siguiente tarea
              </label>
            </div>

            <div class="setting-item">
              <label for="theme">🎨 Tema</label>
              <select
                id="theme"
                [(ngModel)]="userSettings.theme"
                (change)="updateSettings()"
                class="theme-select"
              >
                <option value="default">Por defecto</option>
                <option value="dark">Oscuro</option>
                <option value="light">Claro</option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button class="close-settings-btn" (click)="closeSettings()">
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <!-- Add Motivation Modal -->
      <div
        class="modal-overlay"
        *ngIf="showAddMotivation"
        (click)="closeAddMotivationModal($event)"
      >
        <div class="modal-content">
          <h3>💭 Agregar Motivación Personal</h3>
          <form (ngSubmit)="addCustomMotivation()" #motivationForm="ngForm">
            <div class="form-group">
              <label>Mensaje de Motivación:</label>
              <textarea
                [(ngModel)]="newMotivationText"
                name="motivation"
                required
                class="form-input"
                rows="3"
                placeholder="Ej: ¡Hoy voy a superar mis límites musicales!"
              ></textarea>
            </div>
            <div class="modal-actions">
              <button
                type="submit"
                class="submit-btn"
                [disabled]="!motivationForm.valid"
              >
                Agregar Motivación
              </button>
              <button
                type="button"
                class="cancel-btn"
                (click)="closeAddMotivationModal()"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
      <!-- Settings FAB -->
      <button
        class="settings-fab"
        (click)="openSettings()"
        title="Configuración"
      >
        ⚙️
      </button>
    </div>
  `,
  styles: [
    `
      .app-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          Oxygen, Ubuntu, Cantarell, sans-serif;
      }

      .app-header {
        text-align: center;
        margin-bottom: 30px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        backdrop-filter: blur(10px);
      }

      .app-title {
        color: white;
        font-size: 2.5rem;
        margin-bottom: 10px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .online-indicator {
        font-size: 1rem;
        transition: all 0.3s ease;
      }

      .online-indicator.offline {
        animation: pulse 1.5s ease-in-out infinite;
      }

      .app-subtitle {
        color: rgba(255, 255, 255, 0.9);
        font-size: 1.1rem;
        margin: 0;
      }

      .notification-banner {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        border-radius: 15px;
        margin-bottom: 20px;
        box-shadow: 0 5px 20px rgba(240, 147, 251, 0.3);
      }

      .notification-content {
        display: flex;
        align-items: center;
        padding: 20px;
        gap: 15px;
      }

      .notification-icon {
        font-size: 1.5rem;
      }

      .notification-text {
        flex: 1;
      }

      .notification-text strong {
        display: block;
        margin-bottom: 5px;
      }

      .notification-text p {
        margin: 0;
        opacity: 0.9;
        font-size: 0.9rem;
      }

      .notification-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 2px solid white;
        padding: 10px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .notification-btn:hover {
        background: white;
        color: #f5576c;
      }

      .motivation-card {
        background: linear-gradient(
          135deg,
          #ff9a9e 0%,
          #fecfef 50%,
          #fecfef 100%
        );
        border-radius: 15px;
        padding: 25px;
        margin-bottom: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        animation: fadeIn 1s ease-in;
      }

      .motivation-text {
        font-size: 1.1rem;
        font-weight: 500;
        text-align: center;
        color: #444;
        line-height: 1.6;
      }

      .tab-navigation {
        display: flex;
        justify-content: center;
        margin-bottom: 30px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 8px;
        backdrop-filter: blur(10px);
        overflow-x: auto;
      }

      .tab-btn {
        flex: 1;
        padding: 15px 20px;
        text-align: center;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        border-radius: 10px;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        min-width: 80px;
      }

      .tab-btn:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
      }

      .tab-btn.active {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        transform: scale(1.05);
      }

      .tab-icon {
        font-size: 1.2rem;
      }

      .tab-label {
        font-size: 0.8rem;
      }

      .tab-content {
        animation: slideIn 0.5s ease;
      }

      .analytics-extras {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }

      .analytics-card {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 15px;
        padding: 25px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      .analytics-card h3 {
        margin-bottom: 20px;
        font-size: 1.3rem;
        color: #333;
      }

      .category-detail {
        margin-bottom: 15px;
      }

      .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-weight: 600;
      }

      .category-hours {
        font-size: 0.9rem;
        color: #666;
      }

      .category-progress-bar {
        height: 6px;
        background: #ecf0f1;
        border-radius: 3px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        border-radius: 3px;
        transition: width 1s ease;
      }

      .quick-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .action-btn {
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .reset-btn {
        background: #ff6b6b;
        color: white;
      }

      .reset-btn:hover {
        background: #ff5252;
        transform: translateY(-2px);
      }

      .export-btn {
        background: #4ecdc4;
        color: white;
      }

      .export-btn:hover {
        background: #45b7d1;
        transform: translateY(-2px);
      }

      .motivation-btn {
        background: #9b59b6;
        color: white;
      }

      .motivation-btn:hover {
        background: #8e44ad;
        transform: translateY(-2px);
      }
      .settings-fab {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
        z-index: 100;
      }

      .settings-fab:hover {
        transform: scale(1.1);
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.5);
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: white;
        border-radius: 20px;
        padding: 30px;
        min-width: 400px;
        max-width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
      }

      .settings-modal h3 {
        margin-bottom: 25px;
        font-size: 1.5rem;
        color: #333;
      }

      .setting-item {
        margin-bottom: 20px;
      }

      .setting-label {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        font-weight: 500;
        color: #333;
      }

      .setting-label input[type="checkbox"] {
        width: 18px;
        height: 18px;
        opacity: 0;
      }

      .checkmark {
        width: 18px;
        height: 18px;
        border: 2px solid #ddd;
        border-radius: 4px;
        position: relative;
        transition: all 0.3s ease;
      }

      .setting-label input:checked + .checkmark {
        background: #27ae60;
        border-color: #27ae60;
      }

      .checkmark::after {
        content: "";
        position: absolute;
        left: 5px;
        top: 1px;
        width: 6px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .setting-label input:checked + .checkmark::after {
        opacity: 1;
      }

      .theme-select {
        width: 100%;
        padding: 10px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
      }

      .modal-actions {
        display: flex;
        justify-content: center;
        margin-top: 25px;
      }

      .close-settings-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .close-settings-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
      }
      [data-theme="dark"] {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2d2d2d;
        --text-primary: #ffffff;
        --text-secondary: #b3b3b3;
        --accent-color: #667eea;
      }

      [data-theme="dark"] .app-container {
        background: linear-gradient(135deg, #2d3561 0%, #3d4878 100%);
      }

      [data-theme="dark"] .stat-card,
      [data-theme="dark"] .task-list-container,
      [data-theme="dark"] .analytics-card,
      [data-theme="dark"] .weekly-chart,
      [data-theme="dark"] .modal-content {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }

      [data-theme="dark"] .task-item {
        background: var(--bg-primary);
        color: var(--text-primary);
      }

      /* Light theme styles */
      [data-theme="light"] .app-container {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      }

      [data-theme="light"] .app-header {
        background: rgba(0, 0, 0, 0.1);
      }

      [data-theme="light"] .app-title {
        color: #333;
      }

      [data-theme="light"] .app-subtitle {
        color: rgba(0, 0, 0, 0.7);
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      @media (max-width: 768px) {
        .app-container {
          padding: 10px;
        }

        .app-title {
          font-size: 2rem;
          flex-direction: column;
          gap: 5px;
        }

        .tab-navigation {
          padding: 5px;
        }

        .tab-btn {
          padding: 12px 8px;
          font-size: 0.8rem;
          min-width: 70px;
        }

        .tab-icon {
          font-size: 1rem;
        }

        .tab-label {
          font-size: 0.7rem;
        }

        .analytics-extras {
          grid-template-columns: 1fr;
        }

        .modal-content {
          min-width: 320px;
          padding: 20px;
        }

        .settings-fab {
          width: 50px;
          height: 50px;
          bottom: 20px;
          right: 20px;
          font-size: 1.2rem;
        }
      }
    `,
  ],
})
export class App implements OnInit, OnDestroy {
  // Observables
  isOnline$ = this.localDb.isOnline;
  notificationPermission$ = this.notificationService.permissionStatus;

  // App State
  categories: Category[] = [];
  allTasks: Task[] = [];
  weeklyStats: StudyStats = { viola: 0, az204: 0, conducting: 0 };
  userStreak: UserStreak = {
    user_id: "",
    current_streak: 0,
    longest_streak: 0,
    total_practice_days: 0,
  };
  userSettings: UserSettings = {
    user_id: "",
    sound_enabled: true,
    notifications_enabled: true,
    auto_start_next: false,
    theme: "default",
  };

  // UI State
  activeTab = "dashboard";
  showSettings = false;
  showAddMotivation = false;
  activeTaskId?: number;
  dailyMotivation = "";
  newMotivationText = "";

  // Tab Configuration
  tabs = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "weekly", icon: "📅", label: "Semanal" },
    { id: "viola", icon: "🎻", label: "Viola" },
    { id: "az204", icon: "💻", label: "AZ-204" },
    { id: "conducting", icon: "🎼", label: "Dirección" },
    { id: "analytics", icon: "📈", label: "Análisis" },
  ];

  private subscription = new Subscription();

  constructor(
    private localDb: LocalDatabaseService,
    private timerService: TimerService,
    private notificationService: NotificationService
  ) {
    // Set up timer completion callback
    this.timerService.setOnCompleteCallback((taskId) => {
      if (taskId) {
        this.completeTaskFromTimer(taskId);
      }
    });
  }

  ngOnInit() {
    this.loadInitialData();
    this.setupDataSubscriptions();
    this.applyTheme();
    this.checkWeeklyReset();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private async loadInitialData() {
    // Load categories
    this.subscription.add(
      this.localDb.getCategories().subscribe((categories) => {
        this.categories = categories;
      })
    );

    // Load today's tasks
    const today = new Date().toISOString().split("T")[0];
    this.subscription.add(
      this.localDb.getTasks(today).subscribe((tasks) => {
        this.allTasks = tasks;
      })
    );

    // Load weekly stats
    this.subscription.add(
      this.localDb.getWeeklyStats().subscribe((stats) => {
        this.weeklyStats = { ...stats };
      })
    );

    // Load user settings
    this.subscription.add(
      this.localDb.getUserSettings().subscribe((settings) => {
        this.userSettings = settings;
        this.applyTheme();
      })
    );

    // Load user streak
    this.subscription.add(
      this.localDb.getUserStreak().subscribe((streak) => {
        this.userStreak = streak;
      })
    );

    // Load daily motivation
    this.subscription.add(
      this.localDb.getDailyMotivation().subscribe((motivation) => {
        this.dailyMotivation = motivation;
      })
    );
  }

  private setupDataSubscriptions() {
    // Auto-refresh data periodically
    setInterval(() => {
      const today = new Date().toISOString().split("T")[0];
      this.localDb.getTasks(today).subscribe((tasks) => {
        this.allTasks = tasks;
      });

      this.localDb.getWeeklyStats().subscribe((stats) => {
        this.weeklyStats = { ...stats };
      });
    }, 300000); // 5 minutes
  }

  private async checkWeeklyReset() {
    await this.localDb.checkAndResetWeekly();
  }

  private applyTheme() {
    document.documentElement.setAttribute(
      "data-theme",
      this.userSettings.theme
    );
  }

  get todayTasks(): Task[] {
    const today = new Date().toISOString().split("T")[0];
    return this.allTasks.filter((task) => task.date === today);
  }

  getCategoryTasks(categoryId: string): Task[] {
    return this.allTasks.filter((task) => task.category === categoryId);
  }

  setActiveTab(tabId: string) {
    this.activeTab = tabId;
  }

  async requestNotificationPermission() {
    const permission = await this.notificationService.requestPermission();
    if (permission === "granted") {
      this.userSettings.notifications_enabled = true;
      this.updateSettings();

      this.notificationService.showNotification(
        "¡Notificaciones Activadas! 🎉",
        {
          body: "Ahora recibirás recordatorios para tus prácticas.",
        }
      );
    }
  }

  onTaskToggle(task: Task) {
    this.subscription.add(
      this.localDb
        .updateTask(task.id, {
          completed: task.completed,
          completed_at: task.completed ? new Date().toISOString() : undefined,
        })
        .subscribe((updatedTask) => {
          // Update local state
          const index = this.allTasks.findIndex((t) => t.id === task.id);
          if (index !== -1) {
            this.allTasks[index] = { ...this.allTasks[index], ...updatedTask };
          }

          // Create time session if completed
          if (task.completed) {
            this.localDb
              .createTimeSession({
                task_id: task.id,
                category: task.category,
                description: task.description,
                duration: task.duration,
                date: task.date,
                started_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
              })
              .subscribe();

            // Update weekly stats
            this.weeklyStats[task.category] =
              (this.weeklyStats[task.category] || 0) + task.duration;

            // Update user streak
            this.localDb.updateUserStreak();
          }
        })
    );
  }

  onStartTaskTimer(task: Task) {
    this.activeTaskId = task.id;
    this.timerService.startTimer(task.duration, task.id);
    // Navigate to dashboard to show timer
    this.setActiveTab("dashboard");
  }

  onTimerStarted(state: any) {
    // Timer started, possibly show UI feedback
    console.log("Timer started:", state);
  }

  onTimerComplete(state: any) {
    // Show completion notification
    this.notificationService.showNotification("🎯 ¡Sesión Completada!", {
      body: `Has completado ${Math.floor(
        state.totalTime / 60
      )} minutos de práctica. ¡Excelente trabajo!`,
    });

    this.activeTaskId = undefined;
  }

  private completeTaskFromTimer(taskId: number) {
    const task = this.allTasks.find((t) => t.id === taskId);
    if (task && !task.completed) {
      this.onTaskToggle({ ...task, completed: true });
    }
  }
  onAddTask(taskData: any) {
    this.subscription.add(
      this.localDb
        .createTask({
          ...taskData,
          date: new Date().toISOString().split("T")[0],
        })
        .subscribe((newTask) => {
          this.allTasks.push(newTask);
        })
    );
  }

  onAddWeeklyTask(event: {
    task: Omit<Task, "id" | "created_at" | "user_id">;
    date: string;
  }) {
    this.subscription.add(
      this.localDb
        .createTask({
          ...event.task,
          date: event.date,
        })
        .subscribe((newTask) => {
          this.allTasks.push(newTask);

          // Show success notification
          this.notificationService.showNotification("📝 Tarea Agregada", {
            body: `Nueva tarea creada para ${new Date(
              event.date
            ).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}`,
          });
        })
    );
  }

  onDeleteTask(task: Task) {
    this.subscription.add(
      this.localDb.deleteTask(task.id).subscribe(() => {
        this.allTasks = this.allTasks.filter((t) => t.id !== task.id);
      })
    );
  }

  onUpdateTask(event: { task: Task; updates: Partial<Task> }) {
    this.subscription.add(
      this.localDb
        .updateTask(event.task.id, event.updates)
        .subscribe((updatedTask) => {
          const index = this.allTasks.findIndex((t) => t.id === event.task.id);
          if (index !== -1) {
            this.allTasks[index] = { ...this.allTasks[index], ...updatedTask };
          }
        })
    );
  }

  openSettings() {
    this.showSettings = true;
  }

  closeSettings(event?: Event) {
    if (event && event.target !== event.currentTarget) {
      return;
    }
    this.showSettings = false;
  }

  updateSettings() {
    this.applyTheme();
    this.subscription.add(
      this.localDb.updateUserSettings(this.userSettings).subscribe()
    );
  }

  resetWeeklyProgress() {
    if (
      confirm(
        "¿Estás seguro de que deseas reiniciar el progreso semanal? Esta acción no se puede deshacer."
      )
    ) {
      this.localDb.resetWeeklyProgress().then(() => {
        this.weeklyStats = {};
        // Reload weekly stats
        this.localDb.getWeeklyStats().subscribe((stats) => {
          this.weeklyStats = { ...stats };
        });
      });
    }
  }

  exportData() {
    const data = {
      tasks: this.allTasks,
      weeklyStats: this.weeklyStats,
      categories: this.categories,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-tracker-export-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  addCustomMotivation() {
    if (this.newMotivationText && this.newMotivationText.trim()) {
      this.subscription.add(
        this.localDb
          .addCustomMotivation(this.newMotivationText.trim())
          .subscribe(() => {
            this.notificationService.showNotification(
              "✅ Motivación Agregada",
              {
                body: "Tu mensaje personal ha sido guardado.",
              }
            );
            this.closeAddMotivationModal();
          })
      );
    }
  }

  openAddMotivationModal() {
    this.showAddMotivation = true;
  }

  closeAddMotivationModal(event?: Event) {
    if (event && event.target !== event.currentTarget) {
      return;
    }
    this.showAddMotivation = false;
    this.newMotivationText = "";
  }

  getWeeklyHours(categoryId: string): number {
    const minutes = this.weeklyStats[categoryId] || 0;
    return Math.round((minutes / 60) * 10) / 10;
  }

  getProgressPercentage(categoryId: string): number {
    const category = this.categories.find((c) => c.id === categoryId);
    if (!category) return 0;

    const currentHours = this.getWeeklyHours(categoryId);
    return Math.min((currentHours / category.weekly_goal) * 100, 100);
  }
}

bootstrapApplication(App, {
  providers: [],
}).catch((err) => console.error(err));
