import { addToGlobal, assert, detectInfiniteLoop } from '../utils/utils'

export function addGlobalRgDebug() {
  addToGlobal({
    component: debugComponent,
    lView: debugLView,
  })
}

export function rootLView() {
  const ng = globalThis['ng']
  const dom = ng.getHostElement(globalThis['DOM'])
  return dom.__ngContext__.lView.debug
}

/**
 * Analyze your components at runtime in your debug console.
 * @example rg.component() // The whole application.
 * @example rg.component('MyComponentName') // A specific component.
 * @example rg.component(this) // The component the debugger stopped in.
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
  let cacheNames = {}
  debugLView(rootLView(), { cacheNames })
  return cacheNames[name]
}

export type ComponentDebug = {
  name: string
  context: any
  children: ComponentDebug[]
  parent: ComponentDebug
  more: { lView: any; lContainer: any; injector: any; host: any }
}

export function debugLView(
  lView,
  state: { cacheNames?: {}; cacheLViews?: WeakMap<any, ComponentDebug> } = {}
): ComponentDebug {
  let { cacheNames = {}, cacheLViews = new WeakMap() } = state

  if (!lView) return null
  if (cacheLViews.has(lView)) {
    return cacheLViews.get(lView)
  }

  const output = {} as ComponentDebug
  const name = lView.context.constructor.name
  output.name = name

  // To be able to debug a component by name "rgDebug('MyComponentClassName')"
  // we index the components by name as we traverse the component tree
  if (cacheNames[name]) {
    if (!cacheNames[name].includes(output)) {
      cacheNames[name].push(output)
    }
  } else {
    cacheNames[name] = [output]
  }

  cacheLViews.set(lView, output)

  // Copy context
  output.context = {}
  for (const key in lView.context) {
    if (key !== '__ngContext__') {
      output.context[key] = lView.context[key]
    }
  }

  // More info
  const more = {} as ComponentDebug['more']
  more.lView = lView
  more.injector = lView.injector
  more.host = lView._raw_lView[0]
  output.more = more

  // Parent (recursively)
  const parent = findParent(lView)
  output.parent = debugLView(parent, { cacheNames, cacheLViews })
  if (!output.parent && lView.parent) throw new Error('error')

  // Children (recursively)
  const children = lView.childViews.map(debugView => {
    if (debugView.constructor.name == 'LViewDebug') {
      return debugLView(debugView, { cacheNames, cacheLViews })
    } else if (debugView.constructor.name == 'LContainerDebug') {
      return debugView.views.map(debugView => debugLView(debugView, { cacheNames, cacheLViews }))
    } else if (debugView.constructor.name == 'LContainer') {
      debugger
    }
  })
  output.children = children

  return output
}

function findParent(lView) {
  if (lView.parent) {
    if (lView.parent.context) {
      return lView.parent
    } else {
      return findParent(lView.parent)
    }
  } else {
    return null
  }
}
