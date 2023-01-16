import { DOCUMENT } from '@angular/common'
import {
  createPlatformFactory,
  platformCore,
  PLATFORM_ID,
  PLATFORM_INITIALIZER,
} from '@angular/core'

export const INTERNAL_RECTANGULR_PLATFORM_PROVIDERS = [
  { provide: PLATFORM_ID, useValue: 'rectangulr' },
  { provide: PLATFORM_INITIALIZER, useValue: () => {}, multi: true },
  { provide: DOCUMENT, useValue: {}, deps: [] },
]

export const platformRectangulr = createPlatformFactory(platformCore, 'rectangulr', [
  ...INTERNAL_RECTANGULR_PLATFORM_PROVIDERS,
])
