import { NgIf } from '@angular/common'
import { Component, ElementRef } from '@angular/core'
import { Subject } from 'rxjs'
import { subscribe } from '../../../utils/reactivity'
import { GrowDirective, HBox, VBox } from '../../1-basics/box'
import { ObjectDisplay } from '../object-display'
import { Notification, NotificationsService } from './notifications.service'
import { StyleDirective } from '../../1-basics/style'

@Component({
  standalone: true,
  selector: 'notifications',
  template: `
    <v
      *ngIf="notification"
      [s]="{ display: notification ? 'flex' : 'none', border: 'rounded', hgrow: true }">
      <h *ngIf="notification.name">{{ notification.name }}</h>
      <object-display *ngIf="!notification.name" [object]="notification"></object-display>
      <!-- <h [s]="{ hgrow: true, justifyContent: 'flexEnd' }"><h>Go To Logs: alt+l</h></h> -->
    </v>
  `,
  imports: [VBox, HBox, GrowDirective, NgIf, ObjectDisplay, StyleDirective],
})
export class Notifications {
  notification: Notification

  constructor(public notificationsService: NotificationsService, public elementRef: ElementRef) {
    this.elementRef.nativeElement.style.add({
      position: 'absolute',
      bottom: 1,
      right: 0,
      width: '50%',
      backgroundColor: 'darkgray',
      color: 'white',
      borderColor: 'white'
    })

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
