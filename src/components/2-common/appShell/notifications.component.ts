import { Component } from '@angular/core'
import { Subject } from 'rxjs'
import { subscribe } from '../../../utils/reactivity'
import { Notification, NotificationsService } from './notifications.service'

@Component({
  selector: 'notifications',
  host: { '[style]': "{position: 'absolute', top: 0, right: 1, width: '30%'}" },
  template: `
    <ng-container *ngIf="notification" [style]="{ display: notification ? 'flex' : 'none' }">
      <box>{{ notification.name }}</box>
      <box>{{ notification.message | json5 }}</box>
    </ng-container>
  `,
})
export class Notifications {
  notification: Notification

  constructor(public notificationsService: NotificationsService) {
    subscribe(this, notificationsService.$onNotification, notification => {
      this.notification = notification
    })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
