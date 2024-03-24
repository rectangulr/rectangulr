import { ApplicationConfig } from '@angular/core'
import { View } from '@rectangulr/rectangulr'
import { AppComponent } from './app.component'

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: View, useValue: { name: 'App', component: AppComponent }, multi: true },
  ]
}
