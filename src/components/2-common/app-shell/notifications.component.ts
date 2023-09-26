import { NgIf } from '@angular/common'
import { Component } from '@angular/core'
import { Subject } from 'rxjs'
import { subscribe } from '../../../utils/reactivity'
import { GrowDirective, HBox, VBox } from '../../1-basics/box'
import { ObjectDisplay } from '../object-display'
import { Notification, NotificationsService } from './notifications.service'

@Component({
  standalone: true,
  selector: 'notifications',
  host: {
    '[style]':
      "{position: 'absolute', bottom: 1, right: 0, width: '50%', backgroundColor: 'darkgray', color: 'white', borderColor: 'white' }",
  },
  template: `
    <v
      *ngIf="notification"
      [style]="{ display: notification ? 'flex' : 'none', border: 'rounded', hgrow: true }">
      <h *ngIf="notification.name">{{ notification.name }}</h>
      <object-display *ngIf="!notification.name" [object]="notification"></object-display>
      <!-- <h [style]="{ hgrow: true, justifyContent: 'flexEnd' }"><h>Go To Logs: alt+l</h></h> -->
    </v>
  `,
  imports: [GrowDirective, HBox, NgIf, ObjectDisplay, VBox],
})
export class Notifications {
  notification: Notification

  constructor(public notificationsService: NotificationsService) {
    subscribe(this, notificationsService.$onNotification, async notification => {
      this.notification = notification
      await timeout(4000)
      this.notification = null
    })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
