import { Injectable } from '@angular/core'
import fs from 'fs'

const logFile = './log.json'

export function clear_log() {
  fs.writeFileSync(logFile, '', { flag: 'w' })
}

export function log(thing) {
  if (typeof thing == 'string') {
    fs.writeFileSync(logFile, stringify({ message: thing }) + '\n\n', { flag: 'a+' })
  } else {
    fs.writeFileSync(logFile, stringify(thing) + '\n', { flag: 'a+' })
  }
}

// As a service
@Injectable({ providedIn: 'root' })
export class Logger {
  log = log
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
  console.error = log
  console.log = log
  console.info = log
  console.debug = log
  console.warn = log

  clear_log()
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
