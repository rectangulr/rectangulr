import { assert } from '../utils/utils'

export function rootLView() {
  const ng = globalThis['ng']
  const dom = ng.getHostElement(globalThis['DOM'])
  return dom.__ngContext__.lView
}

// LVIEW
const HOST = 0
const TVIEW = 1
const FLAGS = 2
const PARENT = 3
const NEXT = 4
const TRANSPLANTED_VIEWS_TO_REFRESH = 5
const T_HOST = 6

// LVIEW ONLY
const CLEANUP = 7
const CONTEXT = 8
const INJECTOR = 9
const RENDERER_FACTORY = 10
const RENDERER = 11
const SANITIZER = 12
const CHILD_HEAD = 13
const CHILD_TAIL = 14
const DECLARATION_VIEW = 15
const DECLARATION_COMPONENT_VIEW = 16
const DECLARATION_LCONTAINER = 17
const PREORDER_HOOK_FLAGS = 18
const QUERIES = 19
const ID = 20
const EMBEDDED_VIEW_INJECTOR = 21
export const HEADER_OFFSET = 22

const TVIEW_TYPE_ROOT = 0
const TVIEW_TYPE_COMPONENT = 1
const TVIEW_TYPE_EMBEDDED = 2

// LCONTAINER
const TYPE = 1
const HAS_TRANSPLANTED_VIEWS = 2
const NATIVE = 7
const VIEW_REFS = 8
const MOVED_VIEWS = 9
const CONTAINER_HEADER_OFFSET = 10

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
      globalThis['ng'].getComponent(arg)
    }
    return new NiceView(arg.__ngContext__.lView)
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

  constructor(lContainer: Array<any>, state: { cacheLViews?: WeakMap<any, any> } = {}) {
    let { cacheLViews = new WeakMap() } = state

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
      this.childrenTransplant = lContainer[MOVED_VIEWS]?.map(nicer, { cacheLViews })
    } else {
      this.children = views.map(childView => {
        return nicer(childView, { cacheLViews })
      })
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
