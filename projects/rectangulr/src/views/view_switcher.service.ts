import { Inject, Injectable } from '@angular/core'
import { BehaviorSubject, Subject } from 'rxjs'
import { CommandService, registerCommands } from '../commands/command-service'
import { onChangeEmit } from '../utils/reactivity'

export abstract class View {
  name: string
  component: any
}

@Injectable({
  providedIn: 'root',
})
export class ViewSwitcherService {
  currentView: View = this.views.find(v => v)
  currentViewChanges = new BehaviorSubject(null)

  commands = [
    {
      keys: 'alt+o',
      id: 'cycleView',
      func: () => {
        this.cycleView()
      },
    },
  ]

  constructor(public commandService: CommandService, @Inject(View) public views: View[]) {
    registerCommands(this, this.commands)
    onChangeEmit(this, 'currentView', 'currentViewChanges')
  }

  switchTo(viewName: string) {
    const view = this.views.find(v => v.name == viewName)
    if (!view) throw new Error(`couldnt find view: ${viewName}`)
    this.currentView = view
  }

  cycleView() {
    const currentIndex = this.views.indexOf(this.currentView)
    let newIndex = currentIndex + 1
    if (newIndex > this.views.length - 1) {
      newIndex = 0
    }
    this.currentView = this.views[newIndex]
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
