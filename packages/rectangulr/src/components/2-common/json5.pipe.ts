import { Pipe, PipeTransform } from '@angular/core'
import json5 from 'json5'

@Pipe({
  standalone: true,
  name: 'json5',
})
export class Json5Pipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    try {
      return json5.stringify(value, ...args)
    } catch (e) {
      return `json5: ${e}`
    }
  }
}
