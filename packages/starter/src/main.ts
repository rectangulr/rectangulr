import { bootstrapApplication } from '@rectangulr/rectangulr'
import { appConfig } from './app/app.config'
import { AppShell } from '@rectangulr/rectangulr'

bootstrapApplication(AppShell, appConfig)
  .catch((err) => console.error(err))
