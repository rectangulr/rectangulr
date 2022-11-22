import { Injectable, InjectionToken } from '@angular/core'
import { Subject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  $onNotification = new Subject<Notification>()

  notify(notification: Notification) {
    this.$onNotification.next(notification)
  }
}

export interface Notification {
  name: string
  message: string
}

export const INJECT_NOTIFICATIONS_SERVICE = new InjectionToken<NotificationsService>(
  'Notifications Service'
)
