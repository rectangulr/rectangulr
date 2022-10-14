"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSource = void 0;
const lodash_1 = require("lodash");
const Event_1 = require("./Event");
class EventSource {
    // static [Symbol.hasInstance](instance) {
    //     return instance.constructor === EventSource || Reflect.has(instance, EventSource.symbol)
    // }
    constructor(instance, { getParentInstance = () => undefined } = {}) {
        this.on = () => this.addEventListener;
        this.off = () => this.removeEventListener;
        this.addListener = () => this.addEventListener;
        this.removeListener = () => this.removeEventListener;
        this.instance = instance;
        this.listeners = new Map();
        this.getParentInstance = getParentInstance;
        this.declareEvent(`*`);
    }
    static setup(instance, extra) {
        let eventSource = (instance[EventSource.symbol] = new this(instance, extra));
        for (let methodName of Object.getOwnPropertyNames(EventSource.prototype)) {
            if (methodName === `constructor`)
                continue;
            Object.defineProperty(instance, methodName, {
                value: (...args) => eventSource[methodName](...args),
                enumerable: true,
            });
        }
    }
    getEventSource() {
        return this;
    }
    getParentEventSource() {
        let parent = this.getParentInstance();
        return parent && parent[EventSource.symbol] ? parent[EventSource.symbol] : null;
    }
    hasDeclaredEvent(name) {
        if (!lodash_1.isString(name))
            throw new Error(`Failed to execute 'hasDeclaredEvent': Parameter 1 is not of type 'string'.`);
        return this.listeners.has(name);
    }
    declareEvent(name) {
        if (!lodash_1.isString(name))
            throw new Error(`Failed to execute 'declareEvent': Parameter 1 is not of type 'string'.`);
        if (this.listeners.has(name))
            throw new Error(`Failed to execute 'declareEvent': '${name}' already exists.`);
        this.listeners.set(name, { capture: new Map(), bubble: new Map() });
    }
    addEventListener(name, callback, { capture = false, once = false } = {}) {
        if (!lodash_1.isString(name))
            throw new Error(`Failed to execute 'addEventListener': Parameter 1 is not of type 'string'.`);
        if (!lodash_1.isFunction(callback))
            throw new Error(`Failed to execute 'addEventListener': Parameter 2 is not of type 'function'.`);
        if (!this.listeners.has(name))
            throw new Error(`Failed to execute 'addEventListener': '${name}' is not a valid event name.`);
        let callbacks = capture ? this.listeners.get(name).capture : this.listeners.get(name).bubble;
        if (callbacks.has(callback))
            throw new Error(`Failed to execute 'addEventListener': This callback is already listening on this event.`);
        callbacks.set(callback, { once });
        return () => {
            this.removeEventListener(name, callback);
        };
    }
    removeEventListener(name, callback, { capture = false, once = false } = {}) {
        if (!lodash_1.isString(name))
            throw new Error(`Failed to execute 'removeEventListener': Parameter 1 is not of type 'string'.`);
        if (!lodash_1.isFunction(callback))
            throw new Error(`Failed to execute 'removeEventListener': Parameter 2 is not of type 'function'.`);
        if (!this.listeners.has(name))
            throw new Error(`Failed to execute 'removeEventListener': '${name}' is not a valid event name.`);
        let callbacks = capture ? this.listeners.get(name).capture : this.listeners.get(name).bubble;
        callbacks.delete(callback);
    }
    dispatchEvent(event, { parentSource = this.getParentEventSource() } = {}) {
        if (!(event instanceof Event_1.Event))
            throw new Error(`Failed to execute 'dispatchEvent': Parameter 1 is not of type 'Event'.`);
        if (!this.listeners.has(event.name) || event.name === `*`)
            throw new Error(`Failed to execute 'dispatchEvent': '${event.name}' is not a valid event name.`);
        let eventSources = [this];
        for (let eventSource = parentSource; eventSource; eventSource = eventSource.getParentEventSource())
            eventSources.unshift(eventSource);
        event.target = this.instance;
        for (let t = 0, T = eventSources.length; t < T; ++t) {
            if (event.propagationStopped)
                break;
            let eventSource = eventSources[t];
            let listeners = eventSource.listeners.get(event.name);
            let allListeners = eventSource.listeners.get(`*`);
            for (let [callback, { once }] of [...listeners.capture, ...allListeners.capture]) {
                if (event.immediatlyCanceled)
                    break;
                event.currentTarget = eventSource.instance;
                callback.call(event.currentTarget, event);
            }
        }
        for (let t = 0, T = Math.max(0, event.bubbles ? eventSources.length : 1); t < T; ++t) {
            if (event.propagationStopped)
                break;
            let eventSource = eventSources[eventSources.length - t - 1];
            let listeners = eventSource.listeners.get(event.name);
            let allListeners = eventSource.listeners.get(`*`);
            for (let [callback, { once }] of [...listeners.bubble, ...allListeners.bubble]) {
                if (event.immediatlyCanceled)
                    break;
                event.currentTarget = eventSource.instance;
                callback.call(event.currentTarget, event);
            }
        }
        if (event.default && !event.defaultPrevented) {
            event.default();
        }
    }
}
exports.EventSource = EventSource;
EventSource.symbol = Symbol();
