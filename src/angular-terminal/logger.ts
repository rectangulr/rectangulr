import { Inject, Injectable, InjectionToken } from '@angular/core'
import * as fs from 'fs'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { onChange } from '../utils/reactivity'
import { addToGlobal, circularReplacer, InjectFunction } from '../utils/utils'

export const LOG_FILE = new InjectionToken<string>('LOG_FILE', { factory: () => 'log.json' })

@Injectable({
  providedIn: 'root',
})
export class Logger {
  logs = []
  $logs = new Subject<any[]>()
  $onLog = new Subject<any>()

  constructor(@Inject(LOG_FILE) private logFile: string) {
    onChange(this, 'logs', logs => {
      this.$logs.next(logs)
    })
  }

  log(thing) {
    // String or Object
    let logObject = null
    if (typeof thing == 'string') {
      logObject = { message: thing }
    } else {
      logObject = thing
    }

    // Store in memory (max 200)
    this.logs.push(logObject)
    if (this.logs.length > 200) {
      this.logs = this.logs.slice(-100)
    }
    this.logs = this.logs

    // Store in file
    fs.writeFileSync(this.logFile, stringify(logObject) + '\n', { flag: 'a+' })

    // Notify subscribers
    this.$onLog.next(logObject)
  }
}

export function exportGlobalLogs() {
  addToGlobal({
    logs: function () {
      const inject: InjectFunction = globalThis.rg.inject
      const logger = inject(Logger)
      return logger.logs.slice(-100)
    },
  })
}

export function clearLogFile(logFile: string) {
  fs.writeFileSync(logFile, '', { flag: 'w' })
}

function createConsoleLog(arg: { logger: Logger; level: string }) {
  const { logger, level } = arg
  return function (...things: any[]) {
    if (things.length == 1) {
      const thing = things[0]
      if (typeof thing == 'string') {
        return logger.log({ level: level, message: thing })
      } else {
        return logger.log({ level: level, ...thing })
      }
    } else {
      return logger.log({ level: level, message: things })
    }
  }
}

/**
 * Using console.log messes up the display in the terminal.
 * This patches the console.* functions to write to a file instead.
 */
export function patchGlobalConsole(inject: InjectFunction) {
  const logger = inject(Logger)
  const logFile = inject(LOG_FILE)

  // Save original
  globalThis['original_console'] = _.pick(console, ['error', 'log', 'info', 'debug', 'warn'])

  // Replace
  console.error = createConsoleLog({ logger, level: 'error' })
  console.log = createConsoleLog({ logger, level: 'log' })
  console.info = createConsoleLog({ logger, level: 'info' })
  console.debug = createConsoleLog({ logger, level: 'debug' })
  console.warn = createConsoleLog({ logger, level: 'warn' })

  clearLogFile(logFile)
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

function stringify(thing: any) {
  var cache = []

  if (thing instanceof Error) {
    const property = Object.getOwnPropertyDescriptor(thing, 'message')
    Object.defineProperty(thing, 'message', { ...property, enumerable: true })
  }

  return JSON.stringify(thing, circularReplacer(), 2)
}
