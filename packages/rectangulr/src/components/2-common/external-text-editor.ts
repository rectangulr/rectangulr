import { Injectable, inject } from '@angular/core'
import * as child_process from 'child_process'
import fs from 'fs'
import { Subject } from 'rxjs'
import { ScreenService } from '../../angular-terminal/ScreenService'

@Injectable({
  providedIn: 'root',
})
export class ExternalTextEditor {
  screenService = inject(ScreenService)

  filePath = '/tmp/file.json'
  releaseScreen = false

  edit(text): Subject<any> {
    const stream = new Subject()

    fs.writeFileSync(this.filePath, text)

    if (this.releaseScreen) {
      this.screenService.releaseScreen()
    }
    const editor = child_process.spawn('code', ['-w', this.filePath], {
      stdio: 'inherit',
    })

    const watcher = fs.watch(this.filePath, {}, (eventType, filename) => {
      if (filename) {
        setTimeout(() => {
          const content = fs.readFileSync(this.filePath)
          stream.next(content)
        }, 20)
      }
    })

    editor.on('exit', (code, signal) => {
      stream.complete()
      watcher.close()
      if (this.releaseScreen) {
        this.screenService.releaseScreen()
      }
    })

    return stream
  }
}
