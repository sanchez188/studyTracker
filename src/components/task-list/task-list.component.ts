import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, Category } from '../../models/study-tracker.models';
import { LocalDatabaseService } from '../../services/local-database.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="task-list-container">
      <div class="task-list-header">
        <h3>
          <span *ngIf="category">{{ getCategoryIcon() }} {{ getCategoryName() }}</span>
          <span *ngIf="!category">📋 Tareas de Hoy</span>
        </h3>
        <button class="add-btn" (click)="openAddTaskModal()">
          <span>➕</span> Agregar
        </button>
      </div>

      <div class="tasks-container" *ngIf="tasks.length > 0; else noTasks">
        <div 
          *ngFor="let task of tasks; trackBy: trackByTaskId"
          class="task-item"
          [class.completed]="task.completed"
          [class.category-viola]="task.category === 'viola'"
          [class.category-az204]="task.category === 'az204'"
          [class.category-conducting]="task.category === 'conducting'"
        >
          <div class="task-main">
            <label class="task-checkbox-container">
              <input 
                type="checkbox" 
                [checked]="task.completed"
                (change)="onTaskToggle(task)"
                class="task-checkbox"
              >
              <span class="checkmark"></span>
            </label>

            <div class="task-content">
              <div class="task-description">
                {{ getCategoryIcon(task.category) }} {{ task.description }}
              </div>
              <div class="task-meta">
                <span class="task-time" *ngIf="task.scheduled_time">
                  🕒 {{ formatTime(task.scheduled_time) }}
                </span>
                <span class="task-duration">⏱️ {{ task.duration }}min</span>
              </div>
              <div class="task-notes" *ngIf="task.notes">
                <small>📝 {{ task.notes }}</small>
              </div>
            </div>

            <div class="task-actions">
              <button 
                class="action-btn start-btn"
                (click)="onStartTimer(task)"
                *ngIf="!task.completed"
                title="Iniciar cronómetro"
              >
                ▶️
              </button>
              <button 
                class="action-btn note-btn"
                (click)="onAddNote(task)"
                [title]="task.notes ? 'Editar nota' : 'Agregar nota'"
              >
                📝
              </button>
              <button 
                class="action-btn delete-btn"
                (click)="onDeleteTask(task)"
                title="Eliminar tarea"
              >
                🗑️
              </button>
            </div>
          </div>

          <!-- Expandable note section -->
          <div class="task-note-form" *ngIf="editingNoteTaskId === task.id">
            <textarea
              [(ngModel)]="noteText"
              placeholder="Agregar una nota (ej: 'Completado a las 21:00 en lugar de la hora programada')"
              rows="2"
              class="note-textarea"
            ></textarea>
            <div class="note-actions">
              <button class="save-note-btn" (click)="saveNote(task)">Guardar</button>
              <button class="cancel-note-btn" (click)="cancelNote()">Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      <ng-template #noTasks>
        <div class="no-tasks">
          <div class="no-tasks-icon">🎯</div>
          <p>No hay tareas para mostrar</p>
          <button class="add-btn primary" (click)="openAddTaskModal()">
            Crear primera tarea
          </button>
        </div>
      </ng-template>

      <!-- Add Task Modal -->
      <div class="modal-overlay" *ngIf="showAddModal" (click)="closeAddModal($event)">
        <div class="modal-content">
          <h3>➕ Nueva Tarea</h3>
          <form (ngSubmit)="onAddTask()" #taskForm="ngForm">
            <div class="form-group">
              <label>Descripción *</label>
              <input 
                type="text" 
                [(ngModel)]="newTask.description"
                name="description"
                required
                class="form-input"
                placeholder="Ej: Escalas con cambio de posición"
              >
            </div>

            <div class="form-group">
              <label>Categoría *</label>
              <select 
                [(ngModel)]="newTask.category"
                name="category"
                required
                class="form-select"
              >
                <option *ngFor="let cat of categories" [value]="cat.id">
                  {{ cat.icon }} {{ cat.name }}
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Duración (min) *</label>
                <input 
                  type="number" 
                  [(ngModel)]="newTask.duration"
                  name="duration"
                  min="5"
                  max="240"
                  required
                  class="form-input"
                >
              </div>

              <div class="form-group">
                <label>Hora programada</label>
                <input 
                  type="time" 
                  [(ngModel)]="newTask.scheduled_time"
                  name="time"
                  class="form-input"
                >
              </div>
            </div>

            <div class="modal-actions">
              <button type="submit" class="submit-btn" [disabled]="!taskForm.valid">
                Crear Tarea
              </button>
              <button type="button" class="cancel-btn" (click)="closeAddModal()">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .task-list-container {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .task-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #f0f0f0;
    }

    .task-list-header h3 {
      font-size: 1.3rem;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .add-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .add-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .add-btn.primary {
      font-size: 1rem;
      padding: 12px 24px;
    }

    .tasks-container {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .task-item {
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #ddd;
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .task-item:hover {
      transform: translateX(5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .task-item.completed {
      opacity: 0.6;
      background: #e8f5e8;
    }

    .task-item.completed .task-description {
      text-decoration: line-through;
    }

    .task-item.category-viola {
      border-left-color: #e74c3c;
    }

    .task-item.category-az204 {
      border-left-color: #3498db;
    }

    .task-item.category-conducting {
      border-left-color: #2ecc71;
    }

    .task-main {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
    }

    .task-checkbox-container {
      position: relative;
      cursor: pointer;
    }

    .task-checkbox {
      width: 20px;
      height: 20px;
      opacity: 0;
      cursor: pointer;
    }

    .checkmark {
      position: absolute;
      top: 0;
      left: 0;
      height: 20px;
      width: 20px;
      background: #fff;
      border: 2px solid #ddd;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .task-checkbox:checked + .checkmark {
      background: #27ae60;
      border-color: #27ae60;
    }

    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
      left: 6px;
      top: 2px;
      width: 6px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .task-checkbox:checked + .checkmark:after {
      display: block;
    }

    .task-content {
      flex: 1;
    }

    .task-description {
      font-size: 1rem;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }

    .task-meta {
      display: flex;
      gap: 15px;
      font-size: 0.85rem;
      color: #666;
    }

    .task-notes {
      margin-top: 8px;
      color: #7f8c8d;
      font-style: italic;
    }

    .task-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .start-btn {
      background: #e8f5e8;
      color: #27ae60;
    }

    .start-btn:hover {
      background: #27ae60;
      color: white;
      transform: scale(1.1);
    }

    .note-btn {
      background: #fff3cd;
      color: #856404;
    }

    .note-btn:hover {
      background: #ffc107;
      color: white;
    }

    .delete-btn {
      background: #f8d7da;
      color: #721c24;
    }

    .delete-btn:hover {
      background: #dc3545;
      color: white;
      transform: scale(1.1);
    }

    .task-note-form {
      padding: 15px;
      background: #fff;
      border-top: 1px solid #eee;
    }

    .note-textarea {
      width: 100%;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 12px;
      font-size: 0.9rem;
      resize: vertical;
      font-family: inherit;
    }

    .note-textarea:focus {
      outline: none;
      border-color: #667eea;
    }

    .note-actions {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }

    .save-note-btn, .cancel-note-btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .save-note-btn {
      background: #27ae60;
      color: white;
    }

    .save-note-btn:hover {
      background: #219a52;
    }

    .cancel-note-btn {
      background: #6c757d;
      color: white;
    }

    .cancel-note-btn:hover {
      background: #5a6268;
    }

    .no-tasks {
      text-align: center;
      padding: 40px 20px;
      color: #7f8c8d;
    }

    .no-tasks-icon {
      font-size: 4rem;
      margin-bottom: 20px;
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

    .modal-content h3 {
      margin-bottom: 20px;
      font-size: 1.5rem;
      color: #333;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #555;
    }

    .form-input, .form-select {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: #667eea;
    }

    .modal-actions {
      display: flex;
      gap: 15px;
      justify-content: flex-end;
      margin-top: 25px;
    }

    .submit-btn, .cancel-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .submit-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .cancel-btn {
      background: #6c757d;
      color: white;
    }

    .cancel-btn:hover {
      background: #5a6268;
    }

    @media (max-width: 768px) {
      .task-list-container {
        padding: 15px;
        margin: 10px;
      }

      .task-main {
        padding: 12px;
        gap: 10px;
      }

      .task-actions {
        flex-direction: column;
        gap: 5px;
      }

      .action-btn {
        width: 30px;
        height: 30px;
        font-size: 0.8rem;
      }

      .modal-content {
        min-width: 320px;
        padding: 20px;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TaskListComponent implements OnInit {
  @Input() tasks: Task[] = [];
  @Input() categories: Category[] = [];
  @Input() category?: string;
  @Output() taskToggle = new EventEmitter<Task>();
  @Output() startTimer = new EventEmitter<Task>();
  @Output() addTask = new EventEmitter<Omit<Task, 'id' | 'completed' | 'created_at' | 'user_id'>>();
  @Output() deleteTask = new EventEmitter<Task>();
  @Output() updateTask = new EventEmitter<{ task: Task, updates: Partial<Task> }>();

  showAddModal = false;
  editingNoteTaskId: number | null = null;
  noteText = '';

  newTask = {
    description: '',
    category: '',
    duration: 30,
    scheduled_time: '',
    date: new Date().toISOString().split('T')[0]
  };

  constructor(private localDb: LocalDatabaseService) {}

  ngOnInit() {
    if (this.category && !this.newTask.category) {
      this.newTask.category = this.category;
    }
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  getCategoryIcon(categoryId?: string): string {
    const catId = categoryId || this.category;
    const category = this.categories.find(c => c.id === catId);
    return category?.icon || '🎯';
  }

  getCategoryName(): string {
    const category = this.categories.find(c => c.id === this.category);
    return category?.name || 'Categoría';
  }

  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  onTaskToggle(task: Task) {
    this.taskToggle.emit({
      ...task,
      completed: !task.completed,
      completed_at: !task.completed ? new Date().toISOString() : undefined
    });
  }

  onStartTimer(task: Task) {
    this.startTimer.emit(task);
  }

  onAddNote(task: Task) {
    this.editingNoteTaskId = task.id;
    this.noteText = task.notes || '';
  }

  saveNote(task: Task) {
    if (this.noteText.trim()) {
      this.updateTask.emit({
        task,
        updates: { notes: this.noteText.trim() }
      });
    }
    this.cancelNote();
  }

  cancelNote() {
    this.editingNoteTaskId = null;
    this.noteText = '';
  }

  onDeleteTask(task: Task) {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      this.deleteTask.emit(task);
    }
  }

  openAddTaskModal() {
    this.showAddModal = true;
    if (this.category) {
      this.newTask.category = this.category;
    }
  }

  closeAddModal(event?: Event) {
    if (event && event.target !== event.currentTarget) {
      return;
    }
    this.showAddModal = false;
    this.resetNewTask();
  }

  onAddTask() {
    if (this.newTask.description && this.newTask.category && this.newTask.duration) {
      this.addTask.emit({ ...this.newTask });
      this.closeAddModal();
    }
  }

  private resetNewTask() {
    this.newTask = {
      description: '',
      category: this.category || '',
      duration: 30,
      scheduled_time: '',
      date: new Date().toISOString().split('T')[0]
    };
  }
}