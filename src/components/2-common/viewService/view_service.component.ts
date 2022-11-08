import { Component, Inject } from '@angular/core'
import { ReplaySubject, Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { makeRuleset } from '../../../angular-terminal/dom-terminal'
import { whiteOnGray } from '../styles'
import { View, ViewService } from './view.service'

@Component({
  selector: 'view-service-component',
  template: `
    <box [ngComponentOutlet]="currentView.component"></box>
    <!-- <box
      *ngFor="let view of viewService.views"
      [style]="{ display: currentView == view ? 'flex' : 'none' }"
      [focusSeparate]="focusEmitters.get(view)">
      <ng-container [ngComponentOutlet]="view.component"></ng-container>
    </box> -->

    <box [style]="{ flexGrow: 1 }"></box>

    <box [style]="{ flexDirection: 'row', flexShrink: 0 }">
      <box
        *ngFor="let view of viewService.views"
        [classes]="[nullOnNull, [whiteOnGray, view == currentView]]"
        [style]="{ marginRight: 1 }"
        >{{ view.name }}</box
      >
    </box>
  `,
})
export class ViewServiceComponent {
  currentView: View = null
  focusEmitters: WeakMap<View, Subject<boolean>> = null

  constructor(@Inject(ViewService) public viewService: ViewService) {
    this.focusEmitters = new WeakMap()
    this.viewService.views.forEach(view => {
      this.focusEmitters.set(view, new ReplaySubject(1))
    })
    this.viewService.$currentView.pipe(takeUntil(this.destroy$)).subscribe(currentView => {
      this.currentView = currentView
      this.focusEmitters.get(currentView).next(null)
    })
  }

  ngAfterViewInit() {
    this.focusEmitters.get(this.currentView).next(true)
  }

  whiteOnGray = whiteOnGray
  nullOnNull = makeRuleset({ backgroundColor: null, color: null })

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
