import { Injectable, inject } from '@angular/core'
import * as fs from 'fs'
import * as json5 from 'json5'
import { LOGGER } from '../../angular-terminal/logger'

@Injectable({
  providedIn: 'root',
})
export class ConfigLoader {
  logger = inject(LOGGER)

  fileName = 'config.json'
  config?: any = {}

  constructor() {
    let jsonData = null
    try {
      jsonData = fs.readFileSync(this.fileName, { encoding: 'utf-8' })
    } catch (error) { }
    this.config = json5.parse(jsonData)
  }
}
