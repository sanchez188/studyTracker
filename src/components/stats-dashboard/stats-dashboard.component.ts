import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, StudyStats, UserStreak } from '../../models/study-tracker.models';

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid">
      <div 
        *ngFor="let category of categories"
        class="stat-card"
        [class]="'category-' + category.id"
      >
        <div class="stat-header">
          <span class="stat-icon">{{ category.icon }}</span>
          <h4>{{ category.name }}</h4>
        </div>
        
        <div class="stat-number">
          {{ getWeeklyHours(category.id) }}h
        </div>
        
        <div class="stat-subtitle">
          esta semana
        </div>
        
        <div class="progress-bar">
          <div 
            class="progress-fill"
            [style.width.%]="getProgressPercentage(category.id)"
            [class]="'progress-' + category.id"
          ></div>
        </div>
        
        <div class="stat-goal">
          Meta: {{ category.weekly_goal }}h/semana
        </div>
        
        <div class="stat-status" [class]="getStatusClass(category.id)">
          {{ getStatusText(category.id) }}
        </div>
      </div>
    </div>

    <!-- Weekly Overview Chart -->
    <div class="weekly-chart">
      <h3>📊 Progreso Semanal</h3>
      <div class="chart-container">
        <div 
          *ngFor="let category of categories"
          class="chart-bar"
          [style.flex]="1"
        >
          <div 
            class="bar"
            [class]="'bar-' + category.id"
            [style.height.%]="getBarHeight(category.id)"
          ></div>
          <div class="bar-label">
            <div class="bar-icon">{{ category.icon }}</div>
            <div class="bar-hours">{{ getWeeklyHours(category.id) }}h</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="quick-stat">
        <div class="quick-stat-icon">🎯</div>
        <div class="quick-stat-value">{{ getCompletionRate() }}%</div>
        <div class="quick-stat-label">Objetivos Completados</div>
      </div>
      
      <div class="quick-stat">
        <div class="quick-stat-icon">🔥</div>
        <div class="quick-stat-value">{{ streak.current_streak || 0 }}</div>
        <div class="quick-stat-label">Días Consecutivos</div>
      </div>
      
      <div class="quick-stat">
        <div class="quick-stat-icon">⭐</div>
        <div class="quick-stat-value">{{ getTotalWeeklyHours() }}h</div>
        <div class="quick-stat-label">Total esta Semana</div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      transition: all 0.3s ease;
    }

    .stat-card.category-viola::before {
      background: linear-gradient(90deg, #e74c3c, #c0392b);
    }

    .stat-card.category-az204::before {
      background: linear-gradient(90deg, #3498db, #2980b9);
    }

    .stat-card.category-conducting::before {
      background: linear-gradient(90deg, #2ecc71, #27ae60);
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 15px;
    }

    .stat-icon {
      font-size: 1.8rem;
    }

    .stat-header h4 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .category-viola .stat-number {
      color: #e74c3c;
    }

    .category-az204 .stat-number {
      color: #3498db;
    }

    .category-conducting .stat-number {
      color: #2ecc71;
    }

    .stat-subtitle {
      color: #7f8c8d;
      font-size: 0.9rem;
      margin-bottom: 15px;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #ecf0f1;
      border-radius: 4px;
      margin: 15px 0;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 1s ease;
    }

    .progress-viola {
      background: linear-gradient(90deg, #e74c3c, #c0392b);
    }

    .progress-az204 {
      background: linear-gradient(90deg, #3498db, #2980b9);
    }

    .progress-conducting {
      background: linear-gradient(90deg, #2ecc71, #27ae60);
    }

    .stat-goal {
      font-size: 0.85rem;
      color: #95a5a6;
      margin-bottom: 10px;
    }

    .stat-status {
      font-size: 0.9rem;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 15px;
      display: inline-block;
    }

    .stat-status.excellent {
      background: rgba(39, 174, 96, 0.1);
      color: #27ae60;
    }

    .stat-status.good {
      background: rgba(241, 196, 15, 0.1);
      color: #f39c12;
    }

    .stat-status.needs-attention {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
    }

    .weekly-chart {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      padding: 25px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .weekly-chart h3 {
      font-size: 1.3rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 25px;
      text-align: center;
    }

    .chart-container {
      display: flex;
      align-items: end;
      justify-content: space-around;
      height: 200px;
      gap: 20px;
      padding: 20px 0;
    }

    .chart-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }

    .bar {
      width: 60px;
      border-radius: 8px 8px 0 0;
      transition: all 0.8s ease;
      margin-bottom: 15px;
      position: relative;
    }

    .bar::after {
      content: '';
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .bar:hover::after {
      opacity: 1;
    }

    .bar-viola {
      background: linear-gradient(180deg, #e74c3c, #c0392b);
    }

    .bar-az204 {
      background: linear-gradient(180deg, #3498db, #2980b9);
    }

    .bar-conducting {
      background: linear-gradient(180deg, #2ecc71, #27ae60);
    }

    .bar-label {
      text-align: center;
    }

    .bar-icon {
      font-size: 1.5rem;
      margin-bottom: 5px;
    }

    .bar-hours {
      font-weight: bold;
      color: #333;
    }

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .quick-stat {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }

    .quick-stat:hover {
      transform: translateY(-3px);
    }

    .quick-stat-icon {
      font-size: 2rem;
      margin-bottom: 10px;
    }

    .quick-stat-value {
      font-size: 1.8rem;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }

    .quick-stat-label {
      font-size: 0.9rem;
      color: #7f8c8d;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 15px;
      }

      .stat-card {
        padding: 20px;
      }

      .chart-container {
        height: 150px;
        gap: 10px;
      }

      .bar {
        width: 40px;
      }

      .quick-stats {
        grid-template-columns: 1fr;
        gap: 15px;
      }
    }
  `]
})
export class StatsDashboardComponent implements OnInit {
  @Input() categories: Category[] = [];
  @Input() weeklyStats: Record<string, number> = {};
  @Input() streak: UserStreak = {
    user_id: '',
    current_streak: 0,
    longest_streak: 0,
    total_practice_days: 0
  };

  ngOnInit() {}

  getWeeklyHours(categoryId: string): number {
    const minutes = this.weeklyStats[categoryId] || 0;
    return Math.round((minutes / 60) * 10) / 10;
  }

  getProgressPercentage(categoryId: string): number {
    const category = this.categories.find(c => c.id === categoryId);
    if (!category) return 0;
    
    const currentHours = this.getWeeklyHours(categoryId);
    return Math.min((currentHours / category.weekly_goal) * 100, 100);
  }

  getStatusClass(categoryId: string): string {
    const percentage = this.getProgressPercentage(categoryId);
    if (percentage >= 100) return 'excellent';
    if (percentage >= 75) return 'good';
    return 'needs-attention';
  }

  getStatusText(categoryId: string): string {
    const percentage = this.getProgressPercentage(categoryId);
    if (percentage >= 100) return '¡Objetivo alcanzado!';
    if (percentage >= 75) return 'Buen progreso';
    return 'Necesita atención';
  }

  getBarHeight(categoryId: string): number {
    const maxHours = Math.max(...this.categories.map(c => c.weekly_goal));
    const currentHours = this.getWeeklyHours(categoryId);
    return Math.max((currentHours / maxHours) * 100, 5); // Minimum 5% height for visibility
  }

  getCompletionRate(): number {
    const totalProgress = this.categories.reduce((sum, category) => {
      return sum + this.getProgressPercentage(category.id);
    }, 0);
    return Math.round(totalProgress / this.categories.length);
  }

  getTotalWeeklyHours(): number {
    const totalMinutes = Object.values(this.weeklyStats).reduce((sum, minutes) => sum + minutes, 0);
    return Math.round((totalMinutes / 60) * 10) / 10;
  }
}