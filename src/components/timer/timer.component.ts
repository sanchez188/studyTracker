import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerService } from '../../services/timer.service';
import { TimerState } from '../../models/study-tracker.models';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timer-container" [class.active]="(timerState$ | async)?.isRunning">
      <div class="timer-display" *ngIf="(timerState$ | async) as state">
        <div class="timer-circle">
          <svg class="progress-ring" width="120" height="120">
            <circle
              class="progress-ring-circle"
              stroke="#e0e0e0"
              stroke-width="8"
              fill="transparent"
              r="50"
              cx="60"
              cy="60"
            />
            <circle
              class="progress-ring-progress"
              [attr.stroke]="getProgressColor()"
              stroke-width="8"
              fill="transparent"
              r="50"
              cx="60"
              cy="60"
              [attr.stroke-dasharray]="circumference + ' ' + circumference"
              [attr.stroke-dashoffset]="getStrokeDashoffset()"
            />
          </svg>
          <div class="timer-time">
            {{ formatTime(state.remainingTime) }}
          </div>
        </div>
        
        <div class="timer-controls" *ngIf="state.totalTime > 0">
          <button 
            class="timer-btn" 
            [class.primary]="!state.isRunning"
            [class.secondary]="state.isRunning"
            (click)="toggleTimer()"
          >
            <span class="btn-icon">{{ state.isRunning ? '⏸️' : '▶️' }}</span>
            {{ state.isRunning ? 'Pausar' : 'Reanudar' }}
          </button>
          
          <button class="timer-btn secondary" (click)="stopTimer()">
            <span class="btn-icon">⏹️</span>
            Detener
          </button>
          
          <button class="timer-btn add-time" (click)="addTime(5)">
            <span class="btn-icon">➕</span>
            +5min
          </button>
        </div>
      </div>

      <div class="timer-setup" *ngIf="!(timerState$ | async)?.totalTime">
        <h3>Iniciar Sesión de Práctica</h3>
        <div class="quick-times">
          <button 
            *ngFor="let time of quickTimes" 
            class="quick-time-btn"
            (click)="startQuickTimer(time)"
          >
            {{ time }}min
          </button>
        </div>
      </div>

      <!-- Completion animation overlay -->
      <div class="completion-overlay" *ngIf="showCompletionAnimation">
        <div class="celebration">
          <div class="celebration-text">🎉 ¡Sesión Completada! 🎉</div>
          <div class="confetti"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .timer-container {
      position: relative;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      color: white;
      margin-bottom: 20px;
      transition: all 0.3s ease;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .timer-container.active {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      box-shadow: 0 0 30px rgba(17, 153, 142, 0.4);
      animation: pulse 2s ease-in-out infinite alternate;
    }

    @keyframes pulse {
      from { box-shadow: 0 0 30px rgba(17, 153, 142, 0.4); }
      to { box-shadow: 0 0 50px rgba(17, 153, 142, 0.6); }
    }

    .timer-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .timer-circle {
      position: relative;
    }

    .progress-ring {
      transform: rotate(-90deg);
    }

    .progress-ring-circle {
      transition: stroke-dashoffset 0.5s ease-in-out;
    }

    .progress-ring-progress {
      transition: stroke-dashoffset 0.5s ease-in-out, stroke 0.3s ease;
    }

    .timer-time {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1.8rem;
      font-weight: bold;
      font-family: 'Monaco', 'Menlo', monospace;
    }

    .timer-controls {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .timer-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .timer-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }

    .timer-btn.primary {
      background: rgba(255, 255, 255, 0.9);
      color: #667eea;
    }

    .timer-btn.add-time {
      background: rgba(255, 193, 7, 0.2);
      border-color: rgba(255, 193, 7, 0.5);
    }

    .btn-icon {
      font-size: 1rem;
    }

    .timer-setup h3 {
      margin-bottom: 20px;
      font-size: 1.5rem;
    }

    .quick-times {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .quick-time-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 15px 25px;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1.1rem;
      transition: all 0.3s ease;
    }

    .quick-time-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .completion-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.5s ease;
    }

    .celebration {
      text-align: center;
      position: relative;
    }

    .celebration-text {
      font-size: 2rem;
      font-weight: bold;
      animation: bounce 1s ease-in-out infinite;
    }

    .confetti {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .confetti::before,
    .confetti::after {
      content: '';
      position: absolute;
      width: 10px;
      height: 10px;
      background: #ff6b6b;
      animation: confetti-fall 3s ease-in-out infinite;
    }

    .confetti::before {
      left: 20%;
      animation-delay: 0.5s;
      background: #4ecdc4;
    }

    .confetti::after {
      right: 20%;
      animation-delay: 1s;
      background: #ffe66d;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-20px); }
      60% { transform: translateY(-10px); }
    }

    @keyframes confetti-fall {
      0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(300px) rotate(360deg); opacity: 0; }
    }

    @media (max-width: 768px) {
      .timer-container {
        padding: 20px;
        margin: 10px;
      }
      
      .timer-time {
        font-size: 1.5rem;
      }
      
      .quick-times {
        flex-direction: column;
      }
    }
  `]
})
export class TimerComponent implements OnInit, OnDestroy {
  @Input() taskId?: number;
  @Output() timerComplete = new EventEmitter<TimerState>();
  @Output() timerStarted = new EventEmitter<TimerState>();
  @Output() navigateToTimer = new EventEmitter<void>();

  timerState$!: Observable<TimerState>;
  quickTimes = [5, 10, 15, 20, 30, 45];
  circumference = 2 * Math.PI * 50; // radius = 50
  showCompletionAnimation = false;
  
  private subscription?: Subscription;

  constructor(private timerService: TimerService) {}

  ngOnInit() {
    this.timerState$ = this.timerService.timerState;
    
    this.subscription = this.timerState$.subscribe(state => {
      if (state.remainingTime === 0 && state.totalTime > 0) {
        this.onTimerComplete(state);
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  @HostListener('window:timerCompleted', ['$event'])
  onGlobalTimerComplete(event: CustomEvent) {
    this.showCompletionAnimation = true;
    setTimeout(() => {
      this.showCompletionAnimation = false;
    }, 3000);
  }

  startQuickTimer(minutes: number) {
    this.timerService.startTimer(minutes, this.taskId);
    this.timerStarted.emit({ 
      isRunning: true, 
      remainingTime: minutes * 60, 
      totalTime: minutes * 60,
      taskId: this.taskId 
    });
  }

  toggleTimer() {
    const currentState = this.timerService.timerState;
    currentState.subscribe(state => {
      if (state.isRunning) {
        this.timerService.pauseTimer();
      } else {
        this.timerService.resumeTimer();
      }
    }).unsubscribe();
  }

  stopTimer() {
    this.timerService.stopTimer();
  }

  addTime(minutes: number) {
    this.timerService.addTime(minutes);
  }

  formatTime(seconds: number): string {
    return this.timerService.formatTime(seconds);
  }

  getStrokeDashoffset(): number {
    const progress = this.timerService.getProgress();
    return this.circumference - (progress / 100) * this.circumference;
  }

  getProgressColor(): string {
    const progress = this.timerService.getProgress();
    if (progress < 25) return '#e74c3c';
    if (progress < 50) return '#f39c12';
    if (progress < 75) return '#f1c40f';
    return '#27ae60';
  }

  private onTimerComplete(state: TimerState) {
    this.timerComplete.emit(state);
  }
}