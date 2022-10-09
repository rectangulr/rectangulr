import { Component, Inject } from '@angular/core'
import { ReplaySubject, Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { makeRuleset } from '../mylittledom'
import { whiteOnGray } from '../reusable/styles'
import { View, ViewSwitcherService } from './view_switcher.service'

@Component({
  selector: 'view-switcher',
  template: `
    <box [style]="{ display: 'flex' }" [ngComponentOutlet]="currentView.component"></box>
    <!-- <ng-container *ngFor="let view of viewService.views">
      <box
        [style]="{ display: currentView == view ? 'flex' : 'none' }"
        [focusSeparate]="focusEmitters.get(view)">
        <ng-container [ngComponentOutlet]="view.component"></ng-container>
      </box>
    </ng-container> -->

    <box [style]="{ flexGrow: 1 }"></box>
    <box *ngFor="let view of viewService.views" [style]="{ flexDirection: 'row', height: 1 }">
      <box [classes]="[nullOnNull, [whiteOnGray, view == currentView]]">{{ view.name }}</box>
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
