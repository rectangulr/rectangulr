export interface globalThis {
    ngtDebug: Debug
    ngtDebugView: Debug
}

export function registerGlobalNgtDebug() {
    globalThis['ngtDebug'] = ngtDebug
    globalThis['ngtDebugView'] = debugLView
}

/**
 * Analyze your Angular application at runtime in your debug console.
 * @example ngtDebug() // The whole application
 * ngtDebug('AppComponent') // A specific component
 */
export function ngtDebug(name?: string) {
    const renderer = globalThis['renderer']
    const ng = globalThis['ng']
    const appLView = ng.getRootComponents(renderer)[0].__ngContext__.debug.childViews[0]

    let cache = {}
    if (name) {
        debugLView(appLView, cache)
        return cache[name]
    } else {
        return debugLView(appLView, cache)
    }
}

export type Debug = { name: string; more: More; children: any; context: any }
export type More = { lView: any; lContainer: any; injector: any; host: any }

export function debugLView(lView, cache = {}): Debug {
    const output = {} as Debug

    const name = lView.context.constructor.name
    output.name = name

    // To be able to debug a component by name
    // ngtDebug('MyComponentClassName')
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

    // More info
    const more = {} as More
    more.lView = lView
    more.injector = lView.injector
    more.host = lView._raw_lView[0]
    output.more = more

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

    output.children = children

    return output
}
