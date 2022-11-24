import { Injectable, InjectionToken } from '@angular/core'
import { Subject } from 'rxjs'
import { Logger } from '../../../angular-terminal/logger'
import { subscribe } from '../../../utils/reactivity'

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  $onNotification = new Subject<Notification>()

  constructor(public logger: Logger) {
    subscribe(this, logger.$onLog, thing => {
      if (thing.level == 'error') {
        this.notify(thing)
      }
    })
  }

  notify(notification: Notification) {
    this.$onNotification.next(notification)
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}

export interface Notification {
  name: string
  message: string
}

export const INJECT_NOTIFICATIONS_SERVICE = new InjectionToken<NotificationsService>(
  'Notifications Service'
)
