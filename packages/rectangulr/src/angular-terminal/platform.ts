import { DOCUMENT } from '@angular/common'
import {
  ApplicationConfig,
  ApplicationRef,
  PLATFORM_ID,
  PLATFORM_INITIALIZER,
  Type,
  createPlatformFactory,
  platformCore,
  ɵinternalCreateApplication,
} from '@angular/core'
import { RECTANGULR_MODULE_PROVIDERS } from '../rectangulr-module-providers'

export const INTERNAL_RECTANGULR_PLATFORM_PROVIDERS = [
  { provide: PLATFORM_ID, useValue: 'rectangulr' },
  { provide: PLATFORM_INITIALIZER, useValue: () => { }, multi: true },
  { provide: DOCUMENT, useValue: {}, deps: [] },
]

export const platformRectangulr = createPlatformFactory(platformCore, 'rectangulr', [
  ...INTERNAL_RECTANGULR_PLATFORM_PROVIDERS,
])

/**
 * Bootstraps an instance of an Angular application and renders a standalone component as the
 * application's root component. More information about standalone components can be found in [this
 * guide](guide/standalone-components).
 *
 * @usageNotes
 * The root component passed into this function *must* be a standalone one (should have the
 * `standalone: true` flag in the `@Component` decorator config).
 *
 * ```typescript
 * @Component({
 *   standalone: true,
 *   template: 'Hello world!'
 * })
 * class RootComponent {}
 *
 * const appRef: ApplicationRef = await bootstrapApplication(RootComponent);
 * ```
 *
 * You can add the list of providers that should be available in the application injector by
 * specifying the `providers` field in an object passed as the second argument:
 *
 * ```typescript
 * await bootstrapApplication(RootComponent, {
 *   providers: [
 *     {provide: BACKEND_URL, useValue: 'https://yourdomain.com/api'}
 *   ]
 * });
 * ```
 *
 * The `importProvidersFrom` helper method can be used to collect all providers from any
 * existing NgModule (and transitively from all NgModules that it imports):
 *
 * ```typescript
 * await bootstrapApplication(RootComponent, {
 *   providers: [
 *     importProvidersFrom(SomeNgModule)
 *   ]
 * });
 * ```
 *
 * Note: the `bootstrapApplication` method doesn't include [Testability](api/core/Testability) by
 * default. You can add [Testability](api/core/Testability) by getting the list of necessary
 * providers using `provideProtractorTestingSupport()` function and adding them into the `providers`
 * array, for example:
 *
 * ```typescript
 * import {provideProtractorTestingSupport} from '@angular/platform-browser';
 *
 * await bootstrapApplication(RootComponent, {providers: [provideProtractorTestingSupport()]});
 * ```
 *
 * @param rootComponent A reference to a standalone component that should be rendered.
 * @param options Extra configuration for the bootstrap operation, see `ApplicationConfig` for
 *     additional info.
 * @returns A promise that returns an `ApplicationRef` instance once resolved.
 *
 * @publicApi
 */
export function bootstrapApplication(
  rootComponent: Type<unknown>, options?: ApplicationConfig): Promise<ApplicationRef> {
  return ɵinternalCreateApplication({ rootComponent, ...createProvidersConfig(options) })
}


function createProvidersConfig(options?: ApplicationConfig) {
  return {
    appProviders: [
      ...RECTANGULR_MODULE_PROVIDERS,
      ...(options?.providers ?? []),
    ],
    platformProviders: INTERNAL_RECTANGULR_PLATFORM_PROVIDERS
  }
}
