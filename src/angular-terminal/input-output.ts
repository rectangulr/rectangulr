import { InjectionToken } from '@angular/core'

export interface InputOutput {
  input: ReadInterface
  output: WriteInterface
}

export interface ReadInterface {
  read(): void
  on?(event: string, func: (...args: any[]) => void): any
  subscribe?(func): any

  setRawMode?(boolean): void
}

export interface WriteInterface {
  write(text: string): boolean

  on?(event: string, func: (...args: any[]) => void): any
  on?(event: 'resize', func: () => void): any
  columns?: number
  rows?: number
}

export const StdinStdout: InputOutput = {
  input: process.stdin,
  output: process.stdout,
}

export const VoidInputOuput: InputOutput = {
  input: {
    read: () => {},
    on: (event, func) => {},
    subscribe: func => {},
  },
  output: {
    write: text => true,
    columns: 150,
    rows: 40,
    on: (event, func) => {},
  },
}

export const INPUT_OUTPUT = new InjectionToken<InputOutput>('InputOuput')
