"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugLView = exports.debugComponentByName = exports.debugComponent = exports.rootLView = exports.addGlobalRgDebug = void 0;
const utils_1 = require("../lib/utils");
function addGlobalRgDebug() {
    utils_1.addToGlobal({
        debug: {
            component: debugComponent,
            lView: debugLView,
        },
    });
}
exports.addGlobalRgDebug = addGlobalRgDebug;
function rootLView() {
    const renderer = globalThis['DOM'];
    const ng = globalThis['ng'];
    return ng.getRootComponents(renderer)[0].__ngContext__.debug.childViews[0];
}
exports.rootLView = rootLView;
/**
 * Analyze your components at runtime in your debug console.
 * @example rg.debug.component() // The whole application.
 * @example rg.debug.component('MyComponentName') // A specific component.
 * @example rg.debug.component(this) // The component the debugger stopped in.
 */
function debugComponent(arg) {
    if (typeof arg == 'string') {
        return debugComponentByName(arg);
    }
    else if (typeof arg == 'object') {
        return debugLView(arg.__ngContext__.debug);
    }
    else if (typeof arg == 'undefined') {
        return debugLView(rootLView());
    }
    throw new Error('unreachable');
}
exports.debugComponent = debugComponent;
/**
 * @example rg.debug.component('AppComponent') // A specific component
 */
function debugComponentByName(name) {
    let cache = {};
    debugLView(rootLView(), cache);
    return cache[name];
}
exports.debugComponentByName = debugComponentByName;
function debugLView(lView, cache = {}) {
    const output = {};
    const name = lView.context.constructor.name;
    output.name = name;
    // To be able to debug a component by name "rgDebug('MyComponentClassName')"
    // we index the components by name as we traverse the component tree
    if (cache[name]) {
        if (!cache[name].includes(output)) {
            cache[name].push(output);
        }
    }
    else {
        cache[name] = [output];
    }
    // Copy context
    output.context = {};
    for (const key in lView.context) {
        if (key !== '__ngContext__') {
            output.context[key] = lView.context[key];
        }
    }
    // Children (recursively)
    const children = lView.childViews.map(debugView => {
        if (debugView.constructor.name == 'LViewDebug') {
            return debugLView(debugView, cache);
        }
        else if (debugView.constructor.name == 'LContainerDebug') {
            return debugView.views.map(debugView => debugLView(debugView, cache));
        }
        else if (debugView.constructor.name == 'LContainer') {
            debugger;
        }
    });
    // More info
    const more = {};
    more.lView = lView;
    more.injector = lView.injector;
    more.host = lView._raw_lView[0];
    output.more = more;
    output.children = children;
    return output;
}
exports.debugLView = debugLView;
