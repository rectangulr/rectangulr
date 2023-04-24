import { Injectable } from '@angular/core'
import { spawn } from 'child_process'
import fs from 'fs'
import { Subject } from 'rxjs'
import { ScreenService } from '../../angular-terminal/screen-service'

@Injectable({
  providedIn: 'root',
})
export class TextEditor {
  filePath = '/tmp/file.json'
  constructor(public screenService: ScreenService) {}

  edit(text): Subject<any> {
    const stream = new Subject()

    fs.writeFileSync(this.filePath, text)

    this.screenService.releaseScreen()
    const editor = spawn('code', ['-w', this.filePath], {
      stdio: 'inherit',
    })

    const watcher = fs.watch(this.filePath, {}, (eventType, filename) => {
      if (filename) {
        setTimeout(() => {
          const content = fs.readFileSync(this.filePath)
          stream.next(content)
        })
      }
    })

    editor.on('exit', (code, signal) => {
      stream.complete()
      watcher.close()
      this.screenService.attachScreen()
    })

    return stream
  }
}
