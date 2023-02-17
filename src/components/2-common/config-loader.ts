import { Injectable } from '@angular/core'
import * as fs from 'fs'
import * as json5 from 'json5'
import { Logger } from '../../angular-terminal/logger'

@Injectable({
  providedIn: 'root',
})
export class ConfigLoader {
  fileName = 'config.json'
  config?: any = {}

  constructor(public logger: Logger) {
    let jsonData = null
    try {
      jsonData = fs.readFileSync(this.fileName, { encoding: 'utf-8' })
    } catch (error) {}
    this.config = json5.parse(jsonData)
  }
}
