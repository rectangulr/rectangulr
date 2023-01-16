import { NgIf } from '@angular/common'
import { Component } from '@angular/core'
import { Subject } from 'rxjs'
import { subscribe } from '../../../utils/reactivity'
import { Box } from '../../1-basics/box'
import { ObjectDisplay } from '../object-display'
import { Notification, NotificationsService } from './notifications.service'

@Component({
  standalone: true,
  imports: [Box, NgIf, ObjectDisplay],
  selector: 'notifications',
  host: {
    '[style]':
      "{position: 'absolute', top: 1, right: 1, width: '50%', backgroundColor: 'darkgray', color: 'white', borderColor: 'white' }",
  },
  template: `
    <box
      *ngIf="notification"
      [style]="{ display: notification ? 'flex' : 'none', border: 'rounded' }">
      <object-display [object]="notification"></object-display>
      <box [style]="{ flexGrow: 1, alignItems: 'flexEnd' }">Go To Logs: alt+l</box>
    </box>
  `,
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
