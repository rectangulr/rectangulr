import { addToGlobal } from '../utils/utils'

export function addGlobalRgDebug() {
  addToGlobal({
    debug: {
      component: debugComponent,
    },
  })
}

export function debugComponent(arg: any) {
  if (typeof arg == 'string') {
    return debugComponentByName(arg)
  } else if (typeof arg == 'object') {
    return debugLView(arg.__ngContext__.debug)
  }
  throw new Error('unreachable')
}

/**
 * Analyze your Angular application at runtime in your debug console.
 * @example rgDebug() // The whole application
 * rgDebug('AppComponent') // A specific component
 */
export function debugComponentByName(name?: string) {
  const renderer = globalThis['renderer']
  const ng = globalThis['ng']
  const rootLView = ng.getRootComponents(renderer)[0].__ngContext__.debug.childViews[0]

  let cache = {}
  if (name) {
    debugLView(rootLView, cache)
    return cache[name]
  } else {
    return debugLView(rootLView, cache)
  }
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
