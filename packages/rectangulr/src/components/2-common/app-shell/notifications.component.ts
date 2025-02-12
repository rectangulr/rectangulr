
import { Component, ElementRef, inject } from '@angular/core'
import { Subject } from 'rxjs'
import { subscribe } from '../../../utils/reactivity'
import { signal2 } from '../../../utils/Signal2'
import { H } from '../../../components/1-basics/h'
import { V } from '../../../components/1-basics/v'
import { Style } from '../../1-basics/style'
import { ObjectDisplay } from '../object-display'
import { Notification, NotificationsService } from './notifications.service'

@Component({
  selector: 'notifications',
  template: `
    @if (notification()) {
      <v
        [s]="{ display: notification ? 'flex' : 'none', border: 'rounded', hgrow: true }">
        @if (notification().name) {
          <h>{{ notification().name }}</h>
        }
        <object-display [object]="notification()"/>
        <!-- <h [s]="{ hgrow: true, justifyContent: 'flexEnd' }"><h>Go To Logs: alt+l</h></h> -->
      </v>
    }
    `,
  imports: [V, H, ObjectDisplay, Style]
})
export class Notifications {
  notificationsService = inject(NotificationsService)
  elementRef = inject(ElementRef)

  notification = signal2<Notification | null>(null)

  constructor() {
    this.elementRef.nativeElement.style.add({
      position: 'absolute',
      bottom: 1,
      right: 0,
      width: '50%',
      backgroundColor: 'darkgray',
      color: 'white',
      borderColor: 'white'
    })

    subscribe(null, this.notificationsService.$onNotification, async notification => {
      this.notification.$ = notification
      await timeout(4000)
      this.notification.$ = null
    })
  }
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
