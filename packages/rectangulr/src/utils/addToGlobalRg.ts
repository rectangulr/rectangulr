import { mergeDeep } from "./mergeDeep"

/**
 * Add something to the global variable `rg` from `rectangulr`.
 * @example addToGlobal({
 *  myGlobalFunction: (text)=>{console.log(text)}
 * })
 * rg.myGlobalFunction("print this")
*/
export function addToGlobalRg(obj) {
	globalThis['rg'] ||= {}
	globalThis['rg'] = mergeDeep(globalThis['rg'], obj)
}
