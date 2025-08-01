/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * @fileoverview
 * Private exports intended only for use with the @angular-devkit/build-angular package.
 * All exports are not supported for external use, do not provide SemVer guarantees, and
 * their existence may change in any future version.
 */

import { NoopCompilation, createAngularCompilation } from './tools/angular/compilation'
import {
  CompilerPluginOptions,
} from './tools/esbuild/angular/compiler-plugin'
import { ComponentStylesheetBundler } from './tools/esbuild/angular/component-stylesheets'
import { BundleStylesheetOptions } from './tools/esbuild/stylesheets/bundle-options'

// Builders
export { buildApplicationInternal } from './builders/application'
export type { ApplicationBuilderInternalOptions } from './builders/application/options'
export { type Result, type ResultFile, ResultKind } from './builders/application/results'
export { serveWithVite } from './builders/dev-server/vite-server'
export { execute as executeKarmaInternal } from './builders/karma/application_builder'

// Tools
export * from './tools/babel/plugins'
export type { ExternalResultMetadata } from './tools/esbuild/bundler-execution-result'
export { emitFilesToDisk } from './tools/esbuild/utils'
export { transformSupportedBrowsersToTargets } from './tools/esbuild/utils'
export { SassWorkerImplementation } from './tools/sass/sass-service'

export { SourceFileCache } from './tools/esbuild/angular/source-file-cache'
export { createJitResourceTransformer } from './tools/angular/transformers/jit-resource-transformer'
export { JavaScriptTransformer } from './tools/esbuild/javascript-transformer'

// export function createCompilerPlugin(
//   pluginOptions: CompilerPluginOptions & {
//     browserOnlyBuild?: boolean;
//     noopTypeScriptCompilation?: boolean;
//   },
//   styleOptions: BundleStylesheetOptions & { inlineStyleLanguage: string },
// ): import('esbuild').Plugin {
//   return internalCreateCompilerPlugin(
//     pluginOptions,
//     pluginOptions.noopTypeScriptCompilation
//       ? new NoopCompilation()
//       : () => createAngularCompilation(!!pluginOptions.jit, !!pluginOptions.browserOnlyBuild),
//     new ComponentStylesheetBundler(
//       styleOptions,
//       styleOptions.inlineStyleLanguage,
//       pluginOptions.incremental,
//     ),
//   );
// }

// Utilities
export * from './utils/bundle-calculator'
export { checkPort } from './utils/check-port'
export { deleteOutputDir } from './utils/delete-output-dir'
export { type I18nOptions, createI18nOptions, loadTranslations } from './utils/i18n-options'
export {
  IndexHtmlGenerator,
  type IndexHtmlGeneratorOptions,
  type IndexHtmlGeneratorProcessOptions,
  type IndexHtmlTransform,
} from './utils/index-file/index-html-generator'
export type { FileInfo } from './utils/index-file/augment-index-html'
export {
  type InlineCriticalCssProcessOptions,
  InlineCriticalCssProcessor,
  type InlineCriticalCssProcessorOptions,
} from './utils/index-file/inline-critical-css'
export { loadProxyConfiguration } from './utils/load-proxy-config'
export { type TranslationLoader, createTranslationLoader } from './utils/load-translations'
export { purgeStaleBuildCache } from './utils/purge-cache'
export { augmentAppWithServiceWorker } from './utils/service-worker'
export { type BundleStats, generateBuildStatsTable } from './utils/stats-table'
export { getSupportedBrowsers } from './utils/supported-browsers'
export { assertCompatibleAngularVersion } from './utils/version'
export { findTests, getTestEntrypoints } from './builders/karma/find-tests'
