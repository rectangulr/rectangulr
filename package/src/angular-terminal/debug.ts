import { addToGlobal } from '../lib/utils'

export function addGlobalRgDebug() {
  addToGlobal({
    debug: {
      component: debugComponent,
      lView: debugLView,
    },
  })
}

export function rootLView() {
  const renderer = globalThis['DOM']
  const ng = globalThis['ng']
  return ng.getRootComponents(renderer)[0].__ngContext__.debug.childViews[0]
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
    return debugLView(arg.__ngContext__.debug)
  } else if (typeof arg == 'undefined') {
    return debugLView(rootLView())
  }
  throw new Error('unreachable')
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
