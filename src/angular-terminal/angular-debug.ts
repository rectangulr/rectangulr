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

class LViewDebug {
  constructor(public _raw) {}

  get flags() {
    const flags = this._raw[FLAGS]
    return {
      __raw__flags__: flags,
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
  }

  get parent() {
    return this._raw[PARENT]
  }

  get context() {
    return this._raw[CONTEXT]
  }

  /**
   * The tree of nodes associated with the current `LView`. The nodes have been normalized into
   * a tree structure with relevant details pulled out for readability.
   */
  // get nodes() {
  //   const lView = this._raw;
  //   const tNode = lView[TVIEW].firstChild;
  //   return toDebugNodes(tNode, lView);
  // }

  get injector() {
    return this._raw[INJECTOR]
  }

  get childHead() {
    return this._raw[CHILD_HEAD]
  }

  get next() {
    return this._raw[NEXT]
  }

  get childTail() {
    return this._raw[CHILD_TAIL]
  }

  get childViews() {
    const childViews: any[] = []
    let child = this.childHead

    while (child) {
      childViews.push(child)
      child = child.next
    }

    return childViews
  }
}

class LContainerDebug {
  constructor(public _raw) {}

  get hasTransplantedViews() {
    return this._raw[HAS_TRANSPLANTED_VIEWS]
  }
  get views() {
    return this._raw.slice(CONTAINER_HEADER_OFFSET)
  }
  get parent() {
    return this._raw[PARENT]
  }
  get movedViews() {
    return this._raw[MOVED_VIEWS]
  }
  get host() {
    return this._raw[HOST]
  }
  get native() {
    return this._raw[NATIVE]
  }
  get next() {
    return this._raw[NEXT]
  }
}
