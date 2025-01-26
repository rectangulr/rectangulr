import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core'
import { provideView, View } from '@rectangulr/rectangulr'
import { AppComponent } from './app.component'

export const appConfig: ApplicationConfig = {
  providers: [
    provideView({ name: 'App', component: AppComponent }),
    provideExperimentalZonelessChangeDetection(),
  ]
}
