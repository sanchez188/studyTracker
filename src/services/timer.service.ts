import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { TimerState } from '../models/study-tracker.models';
import { LocalDatabaseService } from './local-database.service';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private timerState$ = new BehaviorSubject<TimerState>({
    isRunning: false,
    remainingTime: 0,
    totalTime: 0
  });
  
  private timerSubscription?: Subscription;
  private audioContext?: AudioContext;
  private completionSound?: AudioBuffer;
  private onTimerCompleteCallback?: (taskId?: number) => void;

  constructor(private localDb: LocalDatabaseService) {
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      this.audioContext = new AudioContext();
      // Create a simple completion tone
      await this.createCompletionSound();
    } catch (error) {
      console.warn('Audio context not available:', error);
    }
  }

  private async createCompletionSound() {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 1; // 1 second
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a pleasant completion chime (C major chord sequence)
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    for (let i = 0; i < data.length; i++) {
      let sample = 0;
      const t = i / sampleRate;
      
      frequencies.forEach((freq, idx) => {
        const envelope = Math.exp(-t * 2); // Exponential decay
        sample += Math.sin(2 * Math.PI * freq * t) * envelope * 0.1;
      });
      
      data[i] = sample;
    }

    this.completionSound = buffer;
  }

  get timerState(): Observable<TimerState> {
    return this.timerState$.asObservable();
  }

  startTimer(durationMinutes: number, taskId?: number): void {
    this.stopTimer(); // Stop any existing timer
    
    const totalSeconds = durationMinutes * 60;
    const startTime = Date.now();
    
    const initialState: TimerState = {
      isRunning: true,
      remainingTime: totalSeconds,
      totalTime: totalSeconds,
      taskId,
      startedAt: new Date()
    };
    
    this.timerState$.next(initialState);

    this.timerSubscription = interval(1000).pipe(
      map(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        return Math.max(0, totalSeconds - elapsed);
      }),
      takeWhile(remaining => remaining >= 0, true)
    ).subscribe(remainingTime => {
      const currentState = this.timerState$.value;
      
      if (remainingTime === 0) {
        // Timer completed
        this.onTimerComplete();
        this.timerState$.next({
          ...currentState,
          isRunning: false,
          remainingTime: 0
        });
      } else {
        this.timerState$.next({
          ...currentState,
          remainingTime
        });
      }
    });
  }

  pauseTimer(): void {
    const currentState = this.timerState$.value;
    if (currentState.isRunning) {
      this.timerSubscription?.unsubscribe();
      this.timerState$.next({
        ...currentState,
        isRunning: false
      });
    }
  }

  resumeTimer(): void {
    const currentState = this.timerState$.value;
    if (!currentState.isRunning && currentState.remainingTime > 0) {
      this.startTimer(currentState.remainingTime / 60, currentState.taskId);
    }
  }

  stopTimer(): void {
    this.timerSubscription?.unsubscribe();
    this.timerState$.next({
      isRunning: false,
      remainingTime: 0,
      totalTime: 0
    });
  }

  addTime(minutes: number): void {
    const currentState = this.timerState$.value;
    const additionalSeconds = minutes * 60;
    
    this.timerState$.next({
      ...currentState,
      remainingTime: currentState.remainingTime + additionalSeconds,
      totalTime: currentState.totalTime + additionalSeconds
    });
  }

  private onTimerComplete(): void {
    this.playCompletionSound();
    this.showCompletionNotification();
    this.triggerCompletionAnimation();
    
    // Call the completion callback if set
    const currentState = this.timerState$.value;
    if (this.onTimerCompleteCallback && currentState.taskId) {
      this.onTimerCompleteCallback(currentState.taskId);
    }
  }

  setOnCompleteCallback(callback: (taskId?: number) => void): void {
    this.onTimerCompleteCallback = callback;
  }
  private async playCompletionSound(): Promise<void> {
    if (!this.audioContext || !this.completionSound) return;

    try {
      // Resume audio context if suspended (required by modern browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = this.completionSound;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Fade out effect
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
      
      source.start();
    } catch (error) {
      console.warn('Could not play completion sound:', error);
    }
  }

  private showCompletionNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const currentState = this.timerState$.value;
      const duration = Math.floor(currentState.totalTime / 60);
      
      new Notification('🎯 ¡Sesión Completada!', {
        body: `Has completado ${duration} minutos de práctica. ¡Excelente trabajo!`,
        icon: '/assets/icon-192x192.png',
        badge: '/assets/badge-72x72.png'
      });
    }
  }

  private triggerCompletionAnimation(): void {
    // Trigger a custom event that components can listen to
    const event = new CustomEvent('timerCompleted', {
      detail: this.timerState$.value
    });
    window.dispatchEvent(event);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getProgress(): number {
    const state = this.timerState$.value;
    if (state.totalTime === 0) return 0;
    return ((state.totalTime - state.remainingTime) / state.totalTime) * 100;
  }
}