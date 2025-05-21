import { Injectable, InjectionToken, inject, signal, untracked } from '@angular/core'
import * as _ from '@s-libs/micro-dash'
import * as fs from 'fs'
import * as os from 'os'
import { Subject } from 'rxjs'
import { InjectFunction, stringifyReplacer } from '../utils/utils'

export const LOG_FILE = new InjectionToken<string>('LOG_FILE', {
  factory: () => os.tmpdir() + '/log.json'
})

export interface Logger {
  log(thing: any): void
}

export const LOGGER = new InjectionToken<Logger>('InjectLogger', {
  providedIn: 'root',
  factory: () => inject(FileLogger),
})

@Injectable({
  providedIn: 'root'
})
export class FileLogger implements Logger {
  $logs = signal<any[]>([])
  $onLog = new Subject<any>()
  logFile = null

  constructor() {
    if (RECTANGULR_TARGET == 'node') {
      this.logFile = inject(LOG_FILE)
    }
  }

  log(thing: any) {
    // String or Object
    let logObject = null
    if (['string', 'number', 'null'].includes(typeof thing)) {
      logObject = { message: String(thing) }
    } else {
      logObject = thing
    }
    const entries = Object.entries(logObject)
    if (entries.length == 1 && logObject.level == 'error') {
      debugger
    }

    // Store in memory (max 200)
    setTimeout(() => {
      this.$logs.update(logs => {
        logs.push(logObject)
        if (logs.length > 200) {
          logs = logs.slice(-100)
        }
        return [...logs]
      })
    })

    // Store in file
    if (RECTANGULR_TARGET == 'node') {
      fs.writeFile(this.logFile, stringify(logObject) + '\n', { flag: 'a+' }, () => { })
    }

    // The previous line has a problem, what is it ?


    // Notify subscribers
    this.$onLog.next(logObject)
  }
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
        const res = _.cloneDeep(thing)
        res['level'] = level
        logger.log(res)
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
export function patchNodeConsole(inject: InjectFunction) {
  const logger = inject(FileLogger)
  const logFile = inject(LOG_FILE)

  // Save original
  globalThis['original_console'] = _.pick(console, 'error', 'log', 'info', 'debug', 'warn')

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

export function stringify(thing: any) {
  var cache = []

  if (thing instanceof Error) {
    const property = Object.getOwnPropertyDescriptor(thing, 'message')
    Object.defineProperty(thing, 'message', { ...property, enumerable: true })
  }

  return JSON.stringify(thing, stringifyReplacer(), 2)
}

export const global_logs = function () {
  const inject: InjectFunction = globalThis.rg.inject
  const logger = inject(FileLogger)
  return logger.$logs().slice(-100)
}

export const REDIRECT_CONSOLE_LOG = new InjectionToken<boolean>('REDIRECT_CONSOLE_LOG', {
  providedIn: 'root',
  factory: () => true
})