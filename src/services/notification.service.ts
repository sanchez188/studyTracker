import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private permission$ = new BehaviorSubject<NotificationPermission>('default');
  
  constructor() {
    if ('Notification' in window) {
      this.permission$.next(Notification.permission);
    }
  }

  get permissionStatus(): Observable<NotificationPermission> {
    return this.permission$.asObservable();
  }

  async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.permission$.next(permission);
      return permission;
    }
    return 'denied';
  }

  showNotification(title: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/assets/icon-192x192.png',
        badge: '/assets/badge-72x72.png',
        ...options
      });
    }
  }

  scheduleNotification(title: string, delay: number, options?: NotificationOptions): void {
    setTimeout(() => {
      this.showNotification(title, options);
    }, delay);
  }
}