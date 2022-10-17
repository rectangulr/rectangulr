import { Component, Inject } from '@angular/core'
import { ReplaySubject, Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { makeRuleset } from '../../../angular-terminal/dom-terminal'
import { whiteOnGray } from '../styles'
import { View, ViewSwitcherService } from './view_switcher.service'

@Component({
  selector: 'view-switcher',
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
        [style]="{ marginRight: 1 }"
        *ngFor="let view of viewService.views"
        [classes]="[nullOnNull, [whiteOnGray, view == currentView]]"
        >{{ view.name }}</box
      >
    </box>
  `,
})
export class ViewSwitcher {
  currentView: View = null
  focusEmitters: WeakMap<View, Subject<boolean>> = null

  constructor(@Inject(ViewSwitcherService) public viewService: ViewSwitcherService) {
    this.focusEmitters = new WeakMap()
    this.viewService.views.forEach(view => {
      this.focusEmitters.set(view, new ReplaySubject(1))
    })
    this.viewService.$currentView.pipe(takeUntil(this.destroy$)).subscribe(currentView => {
      this.currentView = currentView
      this.focusEmitters.get(currentView).next()
    })
  }

  ngAfterViewInit() {
    this.focusEmitters.get(this.currentView).next(true)
  }

  whiteOnGray = whiteOnGray
  nullOnNull = makeRuleset({ backgroundColor: null, color: null })

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}