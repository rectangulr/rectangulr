import { addToGlobal, assert } from '../utils/utils'

export function addGlobalRgDebug() {
  addToGlobal({
    debug: {
      component: debugComponent,
      lView: debugLView,
    },
  })
}

export function rootLView() {
  const ng = globalThis['ng']
  const dom = ng.getHostElement(globalThis['DOM'])
  return dom.__ngContext__.lView.debug
}

/**
 * Analyze your components at runtime in your debug console.
 * @example rg.debug.component() // The whole application.
 * @example rg.debug.component('MyComponentName') // A specific component.
 * @example rg.debug.component(this) // The component the debugger stopped in.
 */
export function debugComponent(arg: any) {
  if (typeof arg == 'string') {
    return debugComponentByName(arg)
  } else if (typeof arg == 'object') {
    if (typeof arg.__ngContext__ == 'number') {
      globalThis['ng'].getComponent(arg)
    }
    return debugLView(arg.__ngContext__.lView.debug)
  } else if (typeof arg == 'undefined') {
    return debugLView(rootLView())
  }
  assert(false, "can't debug this")
}

/**
 * @example rg.debug.component('AppComponent') // A specific component
 */
export function debugComponentByName(name: string) {
  let cache = {}
  debugLView(rootLView(), cache)
  return cache[name]
}

export type ComponentDebug = {
  name: string
  context: any
  children: any
  more: { lView: any; lContainer: any; injector: any; host: any }
}

export function debugLView(lView, cache = {}): ComponentDebug {
  const output = {} as ComponentDebug

  const name = lView.context.constructor.name
  output.name = name

  // To be able to debug a component by name "rgDebug('MyComponentClassName')"
  // we index the components by name as we traverse the component tree
  if (cache[name]) {
    if (!cache[name].includes(output)) {
      cache[name].push(output)
    }
  } else {
    cache[name] = [output]
  }

  // Copy context
  output.context = {}
  for (const key in lView.context) {
    if (key !== '__ngContext__') {
      output.context[key] = lView.context[key]
    }
  }

  // Children (recursively)
  const children = lView.childViews.map(debugView => {
    if (debugView.constructor.name == 'LViewDebug') {
      return debugLView(debugView, cache)
    } else if (debugView.constructor.name == 'LContainerDebug') {
      return debugView.views.map(debugView => debugLView(debugView, cache))
    } else if (debugView.constructor.name == 'LContainer') {
      debugger
    }
  })

  // More info
  const more = {} as ComponentDebug['more']
  more.lView = lView
  more.injector = lView.injector
  more.host = lView._raw_lView[0]
  output.more = more

  output.children = children

  return output
}
