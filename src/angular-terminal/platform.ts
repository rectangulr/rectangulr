import { createPlatformFactory } from '@angular/core'
import { platformBrowser } from '@angular/platform-browser'

export const platformRectangulr = createPlatformFactory(platformBrowser, 'rectangulr', [])
