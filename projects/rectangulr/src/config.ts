import { Injectable } from '@angular/core'
import * as fs from 'fs'
import * as json5 from 'json5'

@Injectable({
  providedIn: 'root',
})
export class ConfigLoader {
  fileName = 'config.json'
  config: any

  constructor() {
    const jsonData = fs.readFileSync(this.fileName, { encoding: 'utf-8' })
    this.config = json5.parse(jsonData)
  }
}
