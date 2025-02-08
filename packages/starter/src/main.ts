import '@angular/compiler'
import { AppShell, bootstrapApplication, provideView, provideXtermJs } from '@rectangulr/rectangulr'
import { AppComponent } from './app/app.component'

if (RECTANGULR_TARGET == 'node') {
  main()
}

export function main(args: { xterm?: any } = {}) {
  bootstrapApplication(AppShell, {
    providers: [
      RECTANGULR_TARGET == 'web' ? provideXtermJs(args.xterm) : [],
      provideView({ name: 'App', component: AppComponent }),
    ]
  }).catch((err) => console.error(err))
}
