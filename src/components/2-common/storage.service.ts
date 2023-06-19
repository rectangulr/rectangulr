import { Injectable } from '@angular/core'
import fs from 'fs'
import _ from 'lodash'
import json5 from 'json5'

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  filePath = './storage.json'
  data: any = {}

  constructor() {
    try {
      const jsonData = fs.readFileSync(this.filePath, { encoding: 'utf-8' })
      this.data = json5.parse(jsonData)
    } catch (error) {}
  }

  get(key) {
    return _.get(this.data, key)
  }

  write(key, data) {
    _.set(this.data, key, data)
    fs.writeFileSync(this.filePath, json5.stringify(this.data))
  }
}
