import '@angular/compiler'
import { AppShell, bootstrapApplication } from '@rectangulr/rectangulr'
import { appConfig } from './app/app.config'

bootstrapApplication(AppShell, appConfig)
  .catch((err) => console.error(err))
