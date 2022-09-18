import { Component, Inject } from '@angular/core'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { makeRuleset } from '../mylittledom'
import { whiteOnGray } from '../reusable/styles'
import { View, ViewSwitcherService } from './view_switcher.service'

@Component({
  selector: 'view-switcher',
  template: `<ng-container [ngComponentOutlet]="currentView.component"></ng-container>
    <box [style]="{ flexGrow: 1 }"></box>
    <box *ngFor="let view of viewService.views" [style]="{ flexDirection: 'row', height: 1 }">
      <box [classes]="[nullOnNull, [whiteOnGray, view == currentView]]">{{ view.name }}</box>
    </box>`,
})
export class ViewSwitcher {
  currentView: View = null

  constructor(@Inject(ViewSwitcherService) public viewService: ViewSwitcherService) {
    this.viewService.currentViewChanges.pipe(takeUntil(this.destroy$)).subscribe(currentView => {
      this.currentView = currentView
    })
  }

  whiteOnGray = whiteOnGray
  nullOnNull = makeRuleset({ backgroundColor: null, color: null })

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
