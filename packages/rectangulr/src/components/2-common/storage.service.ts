import { Injectable, inject } from '@angular/core'
import fs from 'fs'
import json5 from 'json5'
import _ from 'lodash'
import os from 'os'
import { Logger } from '../../angular-terminal/logger'
import { logError } from '../../utils/utils'

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  filePath = os.homedir() + '/.tabulr.json'
  data: any = {}
  saveToDisk = true

  logger = inject(Logger)

  constructor() {
    fs.readFile(this.filePath, { encoding: 'utf-8' }, (err, jsonData) => {
      if (err) {
        logError(this.logger, err)
      } else {
        this.data = json5.parse(jsonData)
      }
    })
  }

  get(key) {
    return _.get(this.data, key)
  }

  write(key, data) {
    _.set(this.data, key, data)
    if (this.saveToDisk) {
      fs.writeFileSync(this.filePath, json5.stringify(this.data))
    }
  }
}
