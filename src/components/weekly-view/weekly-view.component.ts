import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  Task,
  Category,
  WeeklyView,
  DayView,
  ImportData,
} from "../../models/study-tracker.models";
import { LocalDatabaseService } from "../../services/local-database.service";

@Component({
  selector: "app-weekly-view",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="weekly-view-container">
      <div class="weekly-header">
        <div class="week-navigation">
          <button class="nav-btn" (click)="previousWeek()">⬅️</button>
          <h3>{{ getWeekTitle() }}</h3>
          <button class="nav-btn" (click)="nextWeek()">➡️</button>
        </div>

        <div class="week-actions">
          <button class="action-btn import-btn" (click)="openImportModal()">
            📥 Importar JSON
          </button>
          <button class="action-btn export-btn" (click)="exportWeek()">
            📤 Exportar Semana
          </button>
          <button class="action-btn template-btn" (click)="downloadTemplate()">
            📋 Plantilla Semanal
          </button>
          <button class="action-btn clear-week-btn" (click)="clearWeek()">
            🗑️ Limpiar Semana
          </button>
        </div>
      </div>

      <div class="weekly-grid">
        <div
          *ngFor="let day of weeklyView.days"
          class="day-column"
          [class.today]="isToday(day.date)"
        >
          <div class="day-header">
            <h4>{{ day.dayName }}</h4>
            <span class="day-date">{{ formatDate(day.date) }}</span>
            <div class="day-stats">
              <span class="total-time">⏱️ {{ day.totalMinutes }}min</span>
            </div>
            <div class="day-actions">
              <button
                class="clear-day-btn"
                (click)="clearDay(day.date)"
                title="Limpiar día"
                *ngIf="day.tasks.length > 0"
              >
                🗑️
              </button>
            </div>
          </div>

          <div class="day-tasks">
            <div
              *ngFor="let task of day.tasks; trackBy: trackByTaskId"
              class="task-card"
              [class.completed]="task.completed"
              [class]="'category-' + task.category"
            >
              <div class="task-content">
                <div class="task-time" *ngIf="task.scheduled_time">
                  🕒 {{ formatTime(task.scheduled_time) }}
                </div>
                <div class="task-description">
                  {{ getCategoryIcon(task.category) }} {{ task.description }}
                </div>
                <div class="task-duration">⏱️ {{ task.duration }}min</div>

                <div class="task-actions">
                  <button
                    class="toggle-btn"
                    (click)="toggleTask(task)"
                    [title]="
                      task.completed
                        ? 'Marcar como pendiente'
                        : 'Marcar como completada'
                    "
                  >
                    {{ task.completed ? "✅" : "⭕" }}
                  </button>
                  <button
                    class="start-btn"
                    (click)="startTaskTimer(task)"
                    *ngIf="!task.completed"
                    title="Iniciar cronómetro"
                  >
                    ▶️
                  </button>
                  <button
                    class="edit-btn"
                    (click)="editTask(task)"
                    title="Editar tarea"
                  >
                    ✏️
                  </button>
                  <button
                    class="delete-btn"
                    (click)="deleteTask(task)"
                    title="Borrar tarea"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            <button
              class="add-task-btn"
              (click)="addQuickTask(day.date)"
              title="Agregar tarea rápida"
            >
              ➕
            </button>
          </div>

          <div class="day-summary">
            <div *ngFor="let cat of categories" class="category-summary">
              <span class="cat-icon">{{ cat.icon }}</span>
              <span class="cat-time"
                >{{ day.categoryStats[cat.id] || 0 }}min</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Import Modal -->
      <div
        class="modal-overlay"
        *ngIf="showImportModal"
        (click)="closeImportModal($event)"
      >
        <div class="modal-content import-modal">
          <h3>📥 Importar Tareas desde JSON</h3>

          <div class="import-options">
            <div class="import-type">
              <label>
                <input
                  type="radio"
                  [(ngModel)]="importType"
                  value="single-day"
                  name="importType"
                />
                Importar para un día específico
              </label>

              <div *ngIf="importType === 'single-day'" class="date-selector">
                <label>Fecha:</label>
                <input
                  type="date"
                  [(ngModel)]="importDate"
                  class="form-input"
                />
              </div>
            </div>

            <div class="import-type">
              <label>
                <input
                  type="radio"
                  [(ngModel)]="importType"
                  value="full-week"
                  name="importType"
                />
                Importar semana completa (usar fechas del JSON)
              </label>
            </div>
          </div>

          <div class="file-upload">
            <label for="jsonFile" class="file-label">
              📁 Seleccionar archivo JSON
            </label>
            <input
              type="file"
              id="jsonFile"
              accept=".json"
              (change)="onFileSelected($event)"
              class="file-input"
            />
          </div>

          <div class="json-preview" *ngIf="selectedFile">
            <h4>Vista previa:</h4>
            <pre>{{ jsonPreview }}</pre>
          </div>

          <div class="modal-actions">
            <button
              class="submit-btn"
              (click)="importJson()"
              [disabled]="!selectedFile"
            >
              Importar
            </button>
            <button class="cancel-btn" (click)="closeImportModal()">
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <!-- Edit Task Modal -->
      <div
        class="modal-overlay"
        *ngIf="showEditModal"
        (click)="closeEditModal($event)"
      >
        <div class="modal-content edit-modal">
          <h3>✏️ Editar Tarea</h3>

          <div class="form-group">
            <label>Descripción:</label>
            <input
              type="text"
              [(ngModel)]="editingTask.description"
              class="form-input"
              placeholder="Descripción de la tarea"
            />
          </div>

          <div class="form-group">
            <label>Categoría:</label>
            <select [(ngModel)]="editingTask.category" class="form-input">
              <option *ngFor="let cat of categories" [value]="cat.id">
                {{ cat.icon }} {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Duración (minutos):</label>
            <input
              type="number"
              [(ngModel)]="editingTask.duration"
              class="form-input"
              min="1"
              max="480"
            />
          </div>

          <div class="form-group">
            <label>Hora programada (opcional):</label>
            <input
              type="time"
              [(ngModel)]="editingTask.scheduled_time"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Fecha:</label>
            <input
              type="date"
              [(ngModel)]="editingTask.date"
              class="form-input"
            />
          </div>

          <div class="modal-actions">
            <button class="submit-btn" (click)="saveTask()">
              Guardar Cambios
            </button>
            <button class="cancel-btn" (click)="closeEditModal()">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .weekly-view-container {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 15px;
        padding: 25px;
        margin-bottom: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      .weekly-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        flex-wrap: wrap;
        gap: 15px;
      }

      .week-navigation {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .nav-btn {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        transition: transform 0.2s;
      }

      .nav-btn:hover {
        transform: translateY(-2px);
      }

      .week-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .action-btn {
        background: linear-gradient(135deg, #11998e, #38ef7d);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: transform 0.2s;
      }

      .action-btn:hover {
        transform: translateY(-2px);
      }

      .import-btn {
        background: linear-gradient(135deg, #667eea, #764ba2);
      }

      .export-btn {
        background: linear-gradient(135deg, #f093fb, #f5576c);
      }

      .template-btn {
        background: linear-gradient(135deg, #4facfe, #00f2fe);
      }

      .clear-week-btn {
        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      }

      .clear-day-btn {
        background: linear-gradient(135deg, #ff7675, #fd79a8);
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: transform 0.2s;
        margin-top: 5px;
      }

      .clear-day-btn:hover {
        transform: scale(1.1);
      }

      .delete-btn {
        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        color: white;
        border: none;
        cursor: pointer;
        font-size: 0.8rem;
        padding: 2px 4px;
        border-radius: 4px;
        transition: transform 0.2s;
      }

      .delete-btn:hover {
        transform: scale(1.2);
      }

      .day-actions {
        display: flex;
        justify-content: center;
        margin-top: 5px;
      }

      .weekly-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 15px;
        min-height: 500px;
      }

      .day-column {
        background: rgba(255, 255, 255, 0.8);
        border-radius: 12px;
        padding: 15px;
        border: 2px solid transparent;
        transition: border-color 0.3s;
      }

      .day-column.today {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.1);
      }

      .day-header {
        text-align: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }

      .day-header h4 {
        margin: 0;
        color: #333;
        font-size: 1.1rem;
      }

      .day-date {
        display: block;
        font-size: 0.8rem;
        color: #666;
        margin: 5px 0;
      }

      .day-stats {
        font-size: 0.8rem;
        color: #667eea;
        font-weight: 600;
      }

      .day-tasks {
        min-height: 300px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .task-card {
        background: white;
        border-radius: 8px;
        padding: 10px;
        border-left: 4px solid #ddd;
        transition: all 0.3s;
        font-size: 0.85rem;
      }

      .task-card.completed {
        opacity: 0.7;
        background: #f8f9fa;
      }

      .task-card.category-viola {
        border-left-color: #e74c3c;
      }

      .task-card.category-az204 {
        border-left-color: #3498db;
      }

      .task-card.category-conducting {
        border-left-color: #2ecc71;
      }

      .task-content {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .task-time {
        font-size: 0.75rem;
        color: #666;
        font-weight: 500;
      }

      .task-description {
        font-weight: 600;
        color: #333;
        line-height: 1.2;
      }

      .task-duration {
        font-size: 0.75rem;
        color: #667eea;
        font-weight: 500;
      }

      .task-actions {
        display: flex;
        gap: 5px;
        margin-top: 5px;
      }

      .toggle-btn,
      .start-btn,
      .edit-btn,
      .delete-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        padding: 2px;
        transition: transform 0.2s;
      }

      .toggle-btn:hover,
      .start-btn:hover,
      .edit-btn:hover,
      .delete-btn:hover {
        transform: scale(1.2);
      }

      .add-task-btn {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
        margin-top: auto;
        transition: transform 0.2s;
      }

      .add-task-btn:hover {
        transform: translateY(-2px);
      }

      .day-summary {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .category-summary {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 0.7rem;
        background: rgba(102, 126, 234, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: white;
        border-radius: 15px;
        padding: 25px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      }

      .import-modal {
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      }

      .import-options {
        margin: 20px 0;
      }

      .import-type {
        margin-bottom: 15px;
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
      }

      .import-type label {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
      }

      .date-selector {
        margin-top: 10px;
        margin-left: 25px;
      }

      .form-input {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.9rem;
      }

      .file-upload {
        margin: 20px 0;
      }

      .file-label {
        display: inline-block;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .file-label:hover {
        transform: translateY(-2px);
      }

      .file-input {
        display: none;
      }

      .json-preview {
        margin: 20px 0;
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #ddd;
      }

      .json-preview pre {
        max-height: 200px;
        overflow-y: auto;
        font-size: 0.8rem;
        margin: 0;
      }

      .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
      }

      .submit-btn {
        background: linear-gradient(135deg, #11998e, #38ef7d);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .submit-btn:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      .cancel-btn {
        background: #6c757d;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .cancel-btn:hover {
        transform: translateY(-2px);
      }

      .edit-modal {
        max-width: 500px;
        width: 90%;
      }

      .form-group {
        margin-bottom: 15px;
      }

      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #333;
      }

      .form-group .form-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.9rem;
        box-sizing: border-box;
      }

      .form-group .form-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }

      @media (max-width: 1200px) {
        .weekly-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      @media (max-width: 768px) {
        .weekly-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .weekly-header {
          flex-direction: column;
          align-items: stretch;
          text-align: center;
        }

        .week-actions {
          justify-content: center;
        }
      }

      @media (max-width: 480px) {
        .weekly-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class WeeklyViewComponent implements OnInit {
  @Input() categories: Category[] = [];
  @Output() taskToggle = new EventEmitter<Task>();
  @Output() startTimer = new EventEmitter<Task>();
  @Output() addTask = new EventEmitter<{
    task: Omit<Task, "id" | "created_at" | "user_id">;
    date: string;
  }>();

  weeklyView: WeeklyView = {
    startDate: "",
    endDate: "",
    days: [],
  };

  currentWeekStart = new Date();
  showImportModal = false;
  importType: "single-day" | "full-week" = "single-day";
  importDate = new Date().toISOString().split("T")[0];
  selectedFile: File | null = null;
  jsonPreview = "";

  // Edit Task Modal properties
  showEditModal = false;
  editingTask: any = {
    id: 0,
    description: "",
    category: "",
    duration: 30,
    scheduled_time: "",
    date: "",
    completed: false,
  };

  constructor(private localDb: LocalDatabaseService) {
    // Set to Monday of current week
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
    this.currentWeekStart.setDate(today.getDate() + daysFromMonday);
  }

  ngOnInit() {
    this.loadWeeklyView();
  }

  async loadWeeklyView() {
    // Fix timezone issues by formatting date properly
    const year = this.currentWeekStart.getFullYear();
    const month = (this.currentWeekStart.getMonth() + 1)
      .toString()
      .padStart(2, "0");
    const day = this.currentWeekStart.getDate().toString().padStart(2, "0");
    const startDate = `${year}-${month}-${day}`;

    const tasks = await this.localDb.getWeeklyTasks(startDate);

    this.weeklyView = this.buildWeeklyView(startDate, tasks);
  }

  private buildWeeklyView(startDate: string, tasks: Task[]): WeeklyView {
    // Fix timezone issues by constructing date properly
    const [year, month, day] = startDate.split("-").map(Number);
    const start = new Date(year, month - 1, day); // month is 0-indexed
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const days: DayView[] = [];
    const dayNames = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const dayTasks = tasks
        .filter((task) => task.date === dateStr)
        .sort((a, b) =>
          (a.scheduled_time || "").localeCompare(b.scheduled_time || "")
        );

      const totalMinutes = dayTasks.reduce(
        (sum, task) => sum + task.duration,
        0
      );

      const categoryStats: Record<string, number> = {};
      dayTasks.forEach((task) => {
        categoryStats[task.category] =
          (categoryStats[task.category] || 0) + task.duration;
      });

      days.push({
        date: dateStr,
        dayName: dayNames[i],
        tasks: dayTasks,
        totalMinutes,
        categoryStats,
      });
    }

    return {
      startDate,
      endDate: end.toISOString().split("T")[0],
      days,
    };
  }

  getWeekTitle(): string {
    // Fix timezone issues for display
    const [startYear, startMonth, startDay] = this.weeklyView.startDate
      .split("-")
      .map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);

    const [endYear, endMonth, endDay] = this.weeklyView.endDate
      .split("-")
      .map(Number);
    const end = new Date(endYear, endMonth - 1, endDay);

    const startStr = start.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    const endStr = end.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return `${startStr} - ${endStr}`;
  }

  previousWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.loadWeeklyView();
  }

  nextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.loadWeeklyView();
  }

  isToday(date: string): boolean {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const day = today.getDate().toString().padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;
    return date === todayStr;
  }

  formatDate(date: string): string {
    // Fix timezone issues for display
    const [year, month, day] = date.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "numeric",
    });
  }

  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getCategoryIcon(categoryId: string): string {
    const category = this.categories.find((c) => c.id === categoryId);
    return category?.icon || "🎯";
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  toggleTask(task: Task) {
    this.taskToggle.emit({
      ...task,
      completed: !task.completed,
      completed_at: !task.completed ? new Date().toISOString() : undefined,
    });
  }

  startTaskTimer(task: Task) {
    this.startTimer.emit(task);
  }

  async addQuickTask(date: string) {
    const taskData = {
      description: "Nueva tarea",
      category: this.categories[0]?.id || "",
      duration: 30,
      scheduled_time: "",
      completed: false,
      date: date,
    };

    try {
      // Add task directly to database
      await this.localDb.createTask(taskData).toPromise();
      // Reload the weekly view to show the new task
      await this.loadWeeklyView();
    } catch (error) {
      console.error("Error adding quick task:", error);
      alert("Error al agregar la tarea");
    }
  }

  // Edit Task methods
  editTask(task: Task) {
    this.editingTask = { ...task };
    this.showEditModal = true;
  }

  closeEditModal(event?: Event) {
    if (event && event.target !== event.currentTarget) {
      return;
    }
    this.showEditModal = false;
    this.editingTask = {
      id: 0,
      description: "",
      category: "",
      duration: 30,
      scheduled_time: "",
      date: "",
      completed: false,
    };
  }

  async saveTask() {
    if (!this.editingTask.description.trim()) {
      alert("La descripción es requerida");
      return;
    }

    try {
      // Update task in database
      const { id, ...updates } = this.editingTask;
      await this.localDb.updateTask(id, updates).toPromise();

      // Reload the weekly view to show the updated task
      await this.loadWeeklyView();

      // Close modal
      this.closeEditModal();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Error al actualizar la tarea");
    }
  }

  // Import/Export methods
  openImportModal() {
    this.showImportModal = true;
    this.selectedFile = null;
    this.jsonPreview = "";
  }

  closeImportModal(event?: Event) {
    if (event && event.target !== event.currentTarget) {
      return;
    }
    this.showImportModal = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === "application/json") {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const jsonData = JSON.parse(content);
          this.jsonPreview =
            JSON.stringify(jsonData, null, 2).substring(0, 500) + "...";
        } catch (error) {
          this.jsonPreview = "Error: Archivo JSON inválido";
        }
      };
      reader.readAsText(file);
    }
  }

  async importJson() {
    if (!this.selectedFile) return;

    try {
      const content = await this.selectedFile.text();
      const jsonData = JSON.parse(content);

      const importData: ImportData = {
        ...jsonData,
        type: this.importType,
        date: this.importType === "single-day" ? this.importDate : undefined,
      };

      const result = await this.localDb.importFromJson(importData);

      if (result.success) {
        alert(result.message);
        this.loadWeeklyView(); // Reload the view
        this.closeImportModal();
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      alert("Error al procesar el archivo JSON");
    }
  }

  exportWeek() {
    const data = {
      type: "full-week",
      weekStart: this.weeklyView.startDate,
      weekEnd: this.weeklyView.endDate,
      tasks: this.weeklyView.days.flatMap((day) => day.tasks),
      categories: this.categories,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `semana-${this.weeklyView.startDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  downloadTemplate() {
    const template = this.localDb.generateWeekTemplate();
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla-semanal.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  // Clear/Delete methods
  deleteTask(task: Task) {
    if (
      confirm(
        `¿Estás seguro de que quieres borrar la tarea "${task.description}"?`
      )
    ) {
      this.localDb.deleteTask(task.id).subscribe({
        next: () => {
          this.loadWeeklyView(); // Reload to update the view
          alert("Tarea borrada exitosamente");
        },
        error: (error) => {
          console.error("Error al borrar la tarea:", error);
          alert("Error al borrar la tarea");
        },
      });
    }
  }

  async clearDay(date: string) {
    const dayName =
      this.weeklyView.days.find((d) => d.date === date)?.dayName || "el día";
    if (
      confirm(
        `¿Estás seguro de que quieres borrar todas las tareas de ${dayName}?`
      )
    ) {
      try {
        const tasks =
          this.weeklyView.days.find((d) => d.date === date)?.tasks || [];
        let deletedCount = 0;

        for (const task of tasks) {
          await new Promise<void>((resolve, reject) => {
            this.localDb.deleteTask(task.id).subscribe({
              next: () => {
                deletedCount++;
                resolve();
              },
              error: reject,
            });
          });
        }

        await this.loadWeeklyView(); // Reload to update the view
        alert(`Se han borrado ${deletedCount} tareas de ${dayName}`);
      } catch (error) {
        console.error("Error al limpiar el día:", error);
        alert("Error al limpiar el día");
      }
    }
  }

  async clearWeek() {
    const startStr = this.getWeekTitle();
    if (
      confirm(
        `¿Estás seguro de que quieres borrar TODAS las tareas de la semana ${startStr}?`
      )
    ) {
      try {
        let totalDeleted = 0;

        for (const day of this.weeklyView.days) {
          for (const task of day.tasks) {
            await new Promise<void>((resolve, reject) => {
              this.localDb.deleteTask(task.id).subscribe({
                next: () => {
                  totalDeleted++;
                  resolve();
                },
                error: reject,
              });
            });
          }
        }

        await this.loadWeeklyView(); // Reload to update the view
        alert(`Se han borrado ${totalDeleted} tareas de la semana`);
      } catch (error) {
        console.error("Error al limpiar la semana:", error);
        alert("Error al limpiar la semana");
      }
    }
  }
}
