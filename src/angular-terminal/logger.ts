import { Injectable } from '@angular/core'
import * as fs from 'fs'
import { addToGlobal } from '../utils/utils'

@Injectable({ providedIn: 'root' })
export class Logger {
  log(thing) {
    logFunction({})
  }
}

const logFile = './log.json'

let logs = []

addToGlobal({
  logs: () => logs.slice(-100),
})

export function logFunction(thing) {
  let logObject = null
  if (typeof thing == 'string') {
    logObject = { message: thing }
  } else {
    logObject = thing
  }
  logs.push(logObject)
  if (logs.length > 200) {
    logs = logs.slice(-100)
  }
  fs.writeFileSync(logFile, stringify(logObject) + '\n', { flag: 'a+' })
}

export function clearLogFile() {
  fs.writeFileSync(logFile, '', { flag: 'w' })
}

function stringify(thing: any) {
  var cache = []

  if (thing instanceof Error) {
    const property = Object.getOwnPropertyDescriptor(thing, 'message')
    Object.defineProperty(thing, 'message', { ...property, enumerable: true })
  }

  return JSON.stringify(
    thing,
    function (key, value) {
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
          return
        }
        cache.push(value)
      }
      return value
    },
    2
  )
}

/**
 * Using console.log messes up the display in the terminal.
 * This patches the console.* functions to write to a file instead.
 * */
export function patchGlobalConsole() {
  // Save original
  globalThis['original_console'] = {
    error: console.error,
    log: console.log,
    info: console.info,
    debug: console.debug,
    warn: console.warn,
  }

  // Replace
  console.error = logFunction
  console.log = logFunction
  console.info = logFunction
  console.debug = logFunction
  console.warn = logFunction

  clearLogFile()
}

// function caller_location() {
// 	const error = new Error();
// 	const stack = error.stack
// 		.split("\n")
// 		.slice(2)
// 		.map((line) => line.replace(/\s+at\s+/, ""))
// 	const caller = stack?.[2].split(' ');
// 	const location = {
// 		function: caller[0],
// 		file: caller[1],
// 	}
// 	return location;
// }
