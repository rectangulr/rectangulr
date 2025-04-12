import { assert } from '../utils/Assert'

// Copied from: https://github.com/angular/angular/blob/main/packages/core/src/render3/interfaces/view.ts
//              https://github.com/angular/angular/blob/main/packages/core/src/render3/interfaces/container.ts

export function rootLView() {
  const ng = globalThis['ng']
  const dom = ng.getHostElement(globalThis['DOM'])
  return dom.__ngContext__.lView
}

export const HOST = 0
export const TVIEW = 1
export const FLAGS = 2
export const PARENT = 3
export const NEXT = 4
export const DESCENDANT_VIEWS_TO_REFRESH = 5
export const T_HOST = 6
export const CLEANUP = 7
export const CONTEXT = 8
export const INJECTOR = 9
export const ENVIRONMENT = 10
export const RENDERER = 11
export const CHILD_HEAD = 12
export const CHILD_TAIL = 13
// FIXME(misko): Investigate if the three declarations aren't all same thing.
export const DECLARATION_VIEW = 14
export const DECLARATION_COMPONENT_VIEW = 15
export const DECLARATION_LCONTAINER = 16
export const PREORDER_HOOK_FLAGS = 17
export const QUERIES = 18
export const ID = 19
export const EMBEDDED_VIEW_INJECTOR = 20
export const ON_DESTROY_HOOKS = 21
export const HYDRATION = 22
export const REACTIVE_TEMPLATE_CONSUMER = 23
export const REACTIVE_HOST_BINDING_CONSUMER = 24
export const HEADER_OFFSET = 25

// const TVIEW_TYPE_ROOT = 0
// const TVIEW_TYPE_COMPONENT = 1
// const TVIEW_TYPE_EMBEDDED = 2

// LCONTAINER
export const TYPE = 1
export const HAS_TRANSPLANTED_VIEWS = 2
export const NATIVE = 7
export const VIEW_REFS = 8
export const MOVED_VIEWS = 9
export const DEHYDRATED_VIEWS = 10
export const CONTAINER_HEADER_OFFSET = 11

function isLView(value) {
  return Array.isArray(value) && typeof value[TYPE] === 'object'
}

function isLContainer(value) {
  return Array.isArray(value) && value[TYPE] === true
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
      const comp = globalThis['ng'].getComponent(arg)
      return new NiceView(comp)
    } else {
      return new NiceView(arg)
    }
  } else if (typeof arg == 'undefined') {
    return new NiceView(rootLView())
  }
  assert(false, "can't debug this")
}

/**
 * @example rg.debug.component('AppComponent') // A specific component
 */
export function debugComponentByName(name: string) {
  let cacheNames = {}
  new NiceView(rootLView(), { cacheNames })
  return cacheNames[name]
}

export class NiceView {
  name: any
  context: {}
  more: any
  children: (NiceView | NiceContainer)[]

  constructor(lView: Array<any>, state: { cacheNames?: {}; cacheLViews?: WeakMap<any, any> } = {}) {
    let { cacheNames = {}, cacheLViews = new WeakMap() } = state

    if (!lView) return null
    if (cacheLViews.has(lView)) {
      return cacheLViews.get(lView)
    }

    let name = lView[CONTEXT].constructor.name
    this.name = name

    // To be able to debug a component by name "rgDebug('MyComponentClassName')"
    // we index the components by name as we traverse the component tree
    if (cacheNames[name]) {
      if (!cacheNames[name].includes(this)) {
        cacheNames[name].push(this)
      }
    } else {
      cacheNames[name] = [this]
    }

    cacheLViews.set(lView, this)

    // Copy context
    this.context = {}
    for (const key in lView[CONTEXT]) {
      if (key !== '__ngContext__') {
        this.context[key] = lView[CONTEXT][key]
      }
    }

    // More info
    this.more = {}
    this.more.raw = lView
    this.more.injector = lView[INJECTOR]
    this.more.host = lView[HOST]
    const flags = lView[FLAGS]
    this.more.flags = {
      initPhaseState: flags & 3,
      creationMode: !!(flags & 4),
      firstViewPass: !!(flags & 8),
      checkAlways: !!(flags & 16),
      dirty: !!(flags & 32),
      attached: !!(flags & 64),
      destroyed: !!(flags & 128),
      isRoot: !!(flags & 256),
      indexWithinInitPhase: flags >> 11,
    }

    // Children
    let childViews = []
    {
      let child = lView[CHILD_HEAD]
      while (child) {
        childViews.push(child)
        child = child[NEXT]
      }
    }
    this.children = childViews.map(childView => {
      return nicer(childView, { cacheNames, cacheLViews })
    })
  }

  get parent() {
    const lView = this.more.raw
    const parent = lView[PARENT]
    if (parent) {
      return new NiceView(parent)
    }
    return null
  }

  toString() {
    if (this.name == 'Object') {
      return (
        this.children
          // @ts-ignore
          .map(child => child?.name)
          .filter(c => !!c)
          .join(',')
      )
    } else {
      return this.name
    }
  }
}

export class NiceContainer {
  more
  children: any
  childrenTransplant: any

  constructor(
    lContainer: Array<any>,
    state: { cacheNames?: {}; cacheLViews?: WeakMap<any, any> } = {}
  ) {
    let { cacheNames = {}, cacheLViews = new WeakMap() } = state

    if (!lContainer) return null
    if (cacheLViews.has(lContainer)) {
      return cacheLViews.get(lContainer)
    }

    cacheLViews.set(lContainer, this)

    this.more = {}
    this.more.raw = lContainer
    this.more.host = lContainer[HOST]
    this.more.native = lContainer[NATIVE]
    // this.more.next = lContainer[NEXT]
    this.more.hasTransplantedViews = lContainer[HAS_TRANSPLANTED_VIEWS]

    // Children (or transplanted children)
    const views = this.more.raw.slice(CONTAINER_HEADER_OFFSET)
    if (this.more.hasTransplantedViews) {
      this.childrenTransplant = lContainer[MOVED_VIEWS]?.map(nicer, { cacheNames, cacheLViews })
    } else {
      this.children = views
        .map(childView => {
          return childView ? nicer(childView, { cacheNames, cacheLViews }) : null
        })
        .filter(t => !!t)
    }
    assert(this.more.hasTransplantedViews || views)
  }
}

function nicer(lViewOrContainer: Array<any>, state = {}) {
  if (isLView(lViewOrContainer)) {
    return new NiceView(lViewOrContainer, state)
  } else if (isLContainer(lViewOrContainer)) {
    return new NiceContainer(lViewOrContainer, state)
  }
  assert(false)
}

// function findParentThatHasContext(lView) {
//   if (lView[PARENT]) {
//     if (lView[PARENT][CONTEXT]) {
//       return lView[PARENT]
//     } else {
//       return findParentThatHasContext(lView[PARENT])
//     }
//   } else {
//     return null
//   }
// }

export const global_rgComponent = debugComponent
export const global_rgLView = lView => new NiceView(lView)
