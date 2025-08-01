/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {
  BuildFailure,
  Loader,
  Metafile,
  OnStartResult,
  OutputFile,
  PartialMessage,
  Plugin,
  PluginBuild,
} from 'esbuild'
import assert from 'node:assert'
import * as path from 'node:path'
import { maxWorkers, useTypeChecking } from '../../../utils/environment-options'
import { AngularHostOptions } from '../../angular/angular-host'
import { AngularCompilation, DiagnosticModes, NoopCompilation, createAngularCompilation } from '../../angular/compilation'
import { JavaScriptTransformer } from '../javascript-transformer'
import { LoadResultCache, createCachedLoad } from '../load-result-cache'
import { logCumulativeDurations, profileAsync, resetCumulativeDurations } from '../profiling'
import { SharedTSCompilationState, getSharedCompilationState } from './compilation-state'
import { FileReferenceTracker } from './file-reference-tracker'
import { SourceFileCache } from './source-file-cache'
import { E } from '../../../../../angularPlugin'
import { Queue } from '../../../../../Queue'


export function createCompilerPlugin(
  pluginOptions: CompilerPluginOptions & {
    browserOnlyBuild?: boolean
    noopTypeScriptCompilation?: boolean
  },
  queue: Queue<E>,
): import('esbuild').Plugin {
  return internalCreateCompilerPlugin(
    pluginOptions,
    () => createAngularCompilation(!!pluginOptions.jit, !!pluginOptions.browserOnlyBuild),
    queue
  )
}

export interface CompilerPluginOptions {
  sourcemap: boolean | 'external'
  tsconfig: string
  jit?: boolean

  /**
   * Include class metadata and JIT information in built code.
   * The Angular TestBed APIs require additional metadata for the Angular aspects of the application
   * such as Components, Modules, Pipes, etc.
   * TestBed may also leverage JIT capabilities during testing (e.g., overrideComponent).
   */
  includeTestMetadata?: boolean

  advancedOptimizations?: boolean
  thirdPartySourcemaps?: boolean
  fileReplacements?: Record<string, string>
  sourceFileCache?: SourceFileCache
  loadResultCache?: LoadResultCache
  incremental: boolean
  externalRuntimeStyles?: boolean
  instrumentForCoverage?: (request: string) => boolean
  templateUpdates?: Map<string, string>
}

// eslint-disable-next-line max-lines-per-function
export function internalCreateCompilerPlugin(
  pluginOptions: CompilerPluginOptions,
  compilationOrFactory: AngularCompilation | (() => Promise<AngularCompilation>),
  queue: Queue<E>
): Plugin {
  return {
    name: 'angular-compiler',
    // eslint-disable-next-line max-lines-per-function
    async setup(build: PluginBuild): Promise<void> {
      let setupWarnings: PartialMessage[] | undefined = []
      const preserveSymlinks = build.initialOptions.preserveSymlinks

      // Initialize a worker pool for JavaScript transformations.
      // Webcontainers currently do not support this persistent cache store.
      let cacheStore: import('../lmdb-cache-store').LmbdCacheStore | undefined
      if (pluginOptions.sourceFileCache?.persistentCachePath && !process.versions.webcontainer) {
        try {
          const { LmbdCacheStore } = await import('../lmdb-cache-store')
          cacheStore = new LmbdCacheStore(
            path.join(pluginOptions.sourceFileCache.persistentCachePath, 'angular-compiler.db'),
          )
        } catch (e) {
          setupWarnings.push({
            text: 'Unable to initialize JavaScript cache storage.',
            location: null,
            notes: [
              // Only show first line of lmdb load error which has platform support listed
              { text: (e as Error)?.message.split('\n')[0] ?? `${e}` },
              {
                text: 'This will not affect the build output content but may result in slower builds.',
              },
            ],
          })
        }
      }
      const javascriptTransformer = new JavaScriptTransformer(
        {
          sourcemap: !!pluginOptions.sourcemap,
          thirdPartySourcemaps: pluginOptions.thirdPartySourcemaps,
          advancedOptimizations: pluginOptions.advancedOptimizations,
          jit: pluginOptions.jit || pluginOptions.includeTestMetadata,
        },
        maxWorkers,
        cacheStore?.createCache('jstransformer'),
      )

      // Setup defines based on the values used by the Angular compiler-cli
      build.initialOptions.define ??= {}
      build.initialOptions.define['ngI18nClosureMode'] ??= 'false'

      // The factory is only relevant for compatibility purposes with the private API.
      // TODO: Update private API in the next major to allow compilation function factory removal here.
      const compilation =
        typeof compilationOrFactory === 'function'
          ? await compilationOrFactory()
          : compilationOrFactory

      // The in-memory cache of TypeScript file outputs will be used during the build in `onLoad` callbacks for TS files.
      // A string value indicates direct TS/NG output and a Uint8Array indicates fully transformed code.
      const typeScriptFileCache =
        pluginOptions.sourceFileCache?.typeScriptFileCache ??
        new Map<string, string | Uint8Array>()

      // The resources from component stylesheets and web workers that will be added to the build results output files
      const additionalResults = new Map<
        string,
        { outputFiles?: OutputFile[]; metafile?: Metafile; errors?: PartialMessage[] }
      >()

      // Compilation is initially assumed to have errors until emitted
      let hasCompilationErrors = true

      // Determines if TypeScript should process JavaScript files based on tsconfig `allowJs` option
      let shouldTsIgnoreJs = true
      // Determines if transpilation should be handle by TypeScript or esbuild
      let useTypeScriptTranspilation = true

      let sharedTSCompilationState: SharedTSCompilationState | undefined

      // To fully invalidate files, track resource referenced files and their referencing source
      const referencedFileTracker = new FileReferenceTracker()


      let filesToRecompile = new Set<string>()
      queue.subscribe(async event => {
        if (event.type == 'invalidate') {
          filesToRecompile = new Set(event.files)
        }
      })

      // eslint-disable-next-line max-lines-per-function
      build.onStart(async () => {
        sharedTSCompilationState = getSharedCompilationState()
        if (!(compilation instanceof NoopCompilation)) {
          sharedTSCompilationState.markAsInProgress()
        }

        const result: OnStartResult = {
          warnings: setupWarnings,
        }

        // Reset debug performance tracking
        resetCumulativeDurations()

        // Update the reference tracker and generate a full set of modified files for the
        // Angular compiler which does not have direct knowledge of transitive resource
        // dependencies or web worker processing.
        let modifiedFiles = filesToRecompile
        if (
          !(compilation instanceof NoopCompilation) &&
          pluginOptions.sourceFileCache?.modifiedFiles.size
        ) {
          // TODO: Differentiate between changed input files and stale output files
          modifiedFiles = referencedFileTracker.update(pluginOptions.sourceFileCache.modifiedFiles)
          pluginOptions.sourceFileCache.invalidate(modifiedFiles)

          // Remove any stale additional results based on modified files
          modifiedFiles.forEach((file) => additionalResults.delete(file))
        }

        if (compilation.update && filesToRecompile) {
          await compilation.update(filesToRecompile)
        }

        // Create Angular compiler host options
        const hostOptions: AngularHostOptions = {
          fileReplacements: pluginOptions.fileReplacements,
          modifiedFiles,
          sourceFileCache: pluginOptions.sourceFileCache,
          async transformStylesheet(data, containingFile, stylesheetFile, order, className) {
            return null
          },
          processWebWorker(workerFile, containingFile) {
            const fullWorkerPath = path.join(path.dirname(containingFile), workerFile)
            // The synchronous API must be used due to the TypeScript compilation currently being
            // fully synchronous and this process callback being called from within a TypeScript
            // transformer.
            const workerResult = bundleWebWorker(build, pluginOptions, fullWorkerPath);

            (result.warnings ??= []).push(...workerResult.warnings)
            if (workerResult.errors.length > 0) {
              (result.errors ??= []).push(...workerResult.errors)
              // Track worker file errors to allow rebuilds on changes
              referencedFileTracker.add(
                containingFile,
                workerResult.errors
                  .map((error) => error.location?.file)
                  .filter((file): file is string => !!file)
                  .map((file) => path.join(build.initialOptions.absWorkingDir ?? '', file)),
              )
              additionalResults.set(fullWorkerPath, { errors: result.errors })

              // Return the original path if the build failed
              return workerFile
            }

            assert('outputFiles' in workerResult, 'Invalid web worker bundle result.')
            additionalResults.set(fullWorkerPath, {
              outputFiles: workerResult.outputFiles,
              metafile: workerResult.metafile,
            })

            referencedFileTracker.add(
              containingFile,
              Object.keys(workerResult.metafile.inputs).map((input) =>
                path.join(build.initialOptions.absWorkingDir ?? '', input),
              ),
            )

            // Return bundled worker file entry name to be used in the built output
            const workerCodeFile = workerResult.outputFiles.find((file) =>
              /^worker-[A-Z0-9]{8}.[cm]?js$/.test(path.basename(file.path)),
            )
            assert(workerCodeFile, 'Web Worker bundled code file should always be present.')
            const workerCodePath = path.relative(
              build.initialOptions.outdir ?? '',
              workerCodeFile.path,
            )

            return workerCodePath.replaceAll('\\', '/')
          },
        }

        // Initialize the Angular compilation for the current build.
        // In watch mode, previous build state will be reused.
        let referencedFiles
        try {
          const initializationResult = await compilation.initialize(
            pluginOptions.tsconfig,
            hostOptions,
            createCompilerOptionsTransformer(
              setupWarnings,
              pluginOptions,
              preserveSymlinks,
              build.initialOptions.conditions,
            ),
          )
          shouldTsIgnoreJs = !initializationResult.compilerOptions.allowJs
          // Isolated modules option ensures safe non-TypeScript transpilation.
          // Typescript printing support for sourcemaps is not yet integrated.
          useTypeScriptTranspilation =
            !initializationResult.compilerOptions.isolatedModules ||
            !!initializationResult.compilerOptions.sourceMap ||
            !!initializationResult.compilerOptions.inlineSourceMap
          referencedFiles = initializationResult.referencedFiles
          if (initializationResult.templateUpdates) {
            // Propagate any template updates
            initializationResult.templateUpdates.forEach((value, key) =>
              pluginOptions.templateUpdates?.set(key, value),
            )
          }
        } catch (error) {
          (result.errors ??= []).push({
            text: 'Angular compilation initialization failed.',
            location: null,
            notes: [
              {
                text: error instanceof Error ? (error.stack ?? error.message) : `${error}`,
                location: null,
              },
            ],
          })

          // Initialization failure prevents further compilation steps
          hasCompilationErrors = true

          return result
        }

        if (compilation instanceof NoopCompilation) {
          hasCompilationErrors = await sharedTSCompilationState.waitUntilReady

          return result
        }

        // Update TypeScript file output cache for all affected files
        try {
          await profileAsync('NG_EMIT_TS', async () => {
            for (const { filename, contents } of await compilation.emitAffectedFiles()) {
              typeScriptFileCache.set(path.normalize(filename), contents)
            }
          })
        } catch (error) {
          (result.errors ??= []).push({
            text: 'Angular compilation emit failed.',
            location: null,
            notes: [
              {
                text: error instanceof Error ? (error.stack ?? error.message) : `${error}`,
                location: null,
              },
            ],
          })
        }

        const diagnostics = await compilation.diagnoseFiles(
          useTypeChecking ? DiagnosticModes.All : DiagnosticModes.All & ~DiagnosticModes.Semantic,
        )
        if (diagnostics.errors?.length) {
          (result.errors ??= []).push(...diagnostics.errors)
        }
        if (diagnostics.warnings?.length) {
          (result.warnings ??= []).push(...diagnostics.warnings)
        }

        // Add errors from failed additional results.
        // This must be done after emit to capture latest web worker results.
        for (const { errors } of additionalResults.values()) {
          if (errors) {
            (result.errors ??= []).push(...errors)
          }
        }

        // Store referenced files for updated file watching if enabled
        if (pluginOptions.sourceFileCache) {
          pluginOptions.sourceFileCache.referencedFiles = [
            ...referencedFiles,
            ...referencedFileTracker.referencedFiles,
          ]
        }

        hasCompilationErrors = !!result.errors?.length

        // Reset the setup warnings so that they are only shown during the first build.
        setupWarnings = undefined

        sharedTSCompilationState.markAsReady(hasCompilationErrors)

        return result
      })

      build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async (args) => {
        const request = path.normalize(
          pluginOptions.fileReplacements?.[path.normalize(args.path)] ?? args.path,
        )
        const isJS = /\.[cm]?js$/.test(request)
        const isTS = /\.[cm]?tsx?$/.test(request)
        if (isTS) {
          queue.send({ type: 'watchFile', path: request })
        }

        // Skip TS load attempt if JS TypeScript compilation not enabled and file is JS
        if (shouldTsIgnoreJs && isJS) {
          return undefined
        }

        // The filename is currently used as a cache key. Since the cache is memory only,
        // the options cannot change and do not need to be represented in the key. If the
        // cache is later stored to disk, then the options that affect transform output
        // would need to be added to the key as well as a check for any change of content.
        let contents = typeScriptFileCache.get(request)

        if (contents === undefined) {
          // If the Angular compilation had errors the file may not have been emitted.
          // To avoid additional errors about missing files, return empty contents.
          if (hasCompilationErrors) {
            return { contents: '', loader: 'js' }
          }

          // No TS result indicates the file is not part of the TypeScript program.
          // If allowJs is enabled and the file is JS then defer to the next load hook.
          if (!shouldTsIgnoreJs && isJS) {
            return undefined
          }

          // Otherwise return an error
          return {
            errors: [
              createMissingFileError(request, args.path, build.initialOptions.absWorkingDir ?? ''),
            ],
          }
        } else if (typeof contents === 'string' && (useTypeScriptTranspilation || isJS)) {
          // A string indicates untransformed output from the TS/NG compiler.
          // This step is unneeded when using esbuild transpilation.
          const sideEffects = await hasSideEffects(request)
          const instrumentForCoverage = pluginOptions.instrumentForCoverage?.(request)
          contents = await javascriptTransformer.transformData(
            request,
            contents,
            true /* skipLinker */,
            sideEffects,
            instrumentForCoverage,
          )

          // Store as the returned Uint8Array to allow caching the fully transformed code
          typeScriptFileCache.set(request, contents)
        }

        let loader: Loader
        if (useTypeScriptTranspilation || isJS) {
          // TypeScript has transpiled to JS or is already JS
          loader = 'js'
        } else if (request.at(-1) === 'x') {
          // TSX and TS have different syntax rules. Only set if input is a TSX file.
          loader = 'tsx'
        } else {
          // Otherwise, directly bundle TS
          loader = 'ts'
        }

        return {
          contents,
          loader,
        }
      })

      build.onLoad(
        { filter: /\.[cm]?js$/ },
        createCachedLoad(pluginOptions.loadResultCache, async (args) => {
          let request = args.path
          if (pluginOptions.fileReplacements) {
            const replacement = pluginOptions.fileReplacements[path.normalize(args.path)]
            if (replacement) {
              request = path.normalize(replacement)
            }
          }

          return profileAsync(
            'NG_EMIT_JS*',
            async () => {
              const sideEffects = await hasSideEffects(request)
              const contents = await javascriptTransformer.transformFile(
                request,
                pluginOptions.jit,
                sideEffects,
              )

              return {
                contents,
                loader: 'js',
                watchFiles: request !== args.path ? [request] : undefined,
              }
            },
            true,
          )
        }),
      )

      // Add a load handler if there are file replacement option entries for JSON files
      if (
        pluginOptions.fileReplacements &&
        Object.keys(pluginOptions.fileReplacements).some((value) => value.endsWith('.json'))
      ) {
        build.onLoad(
          { filter: /\.json$/ },
          createCachedLoad(pluginOptions.loadResultCache, async (args) => {
            const replacement = pluginOptions.fileReplacements?.[path.normalize(args.path)]
            if (replacement) {
              return {
                contents: await import('node:fs/promises').then(({ readFile }) =>
                  readFile(path.normalize(replacement)),
                ),
                loader: 'json' as const,
                watchFiles: [replacement],
              }
            }

            // If no replacement defined, let esbuild handle it directly
            return null
          }),
        )
      }

      build.onEnd((result) => {
        // Ensure other compilations are unblocked if the main compilation throws during start
        sharedTSCompilationState?.markAsReady(hasCompilationErrors)

        for (const { outputFiles, metafile } of additionalResults.values()) {
          // Add any additional output files to the main output files
          if (outputFiles?.length) {
            result.outputFiles?.push(...outputFiles)
          }

          // Combine additional metafiles with main metafile
          if (result.metafile && metafile) {
            // Append the existing object, by appending to it we prevent unnecessary new objections creations with spread
            // mitigating significant performance overhead for large apps.
            // See: https://bugs.chromium.org/p/v8/issues/detail?id=11536
            Object.assign(result.metafile.inputs, metafile.inputs)
            Object.assign(result.metafile.outputs, metafile.outputs)
          }
        }

        logCumulativeDurations()
      })

      build.onDispose(() => {
        sharedTSCompilationState?.dispose()
        void compilation.close?.()
        void cacheStore?.close()
      })

      /**
       * Checks if the file has side-effects when `advancedOptimizations` is enabled.
       */
      async function hasSideEffects(path: string): Promise<boolean | undefined> {
        if (!pluginOptions.advancedOptimizations) {
          return undefined
        }

        const { sideEffects } = await build.resolve(path, {
          kind: 'import-statement',
          resolveDir: build.initialOptions.absWorkingDir ?? '',
        })

        return sideEffects
      }
    },
  }
}


function createCompilerOptionsTransformer(
  setupWarnings: PartialMessage[] | undefined,
  pluginOptions: CompilerPluginOptions,
  preserveSymlinks: boolean | undefined,
  customConditions: string[] | undefined,
): Parameters<AngularCompilation['initialize']>[2] {
  return (compilerOptions) => {
    // target of 9 is ES2022 (using the number avoids an expensive import of typescript just for an enum)
    if (compilerOptions.target === undefined || compilerOptions.target < 9 /** ES2022 */) {
      // If 'useDefineForClassFields' is already defined in the users project leave the value as is.
      // Otherwise fallback to false due to https://github.com/microsoft/TypeScript/issues/45995
      // which breaks the deprecated `@Effects` NGRX decorator and potentially other existing code as well.
      compilerOptions.target = 9 /** ES2022 */
      compilerOptions.useDefineForClassFields ??= false

      // Only add the warning on the initial build
      setupWarnings?.push({
        text:
          `TypeScript compiler options 'target' and 'useDefineForClassFields' are set to 'ES2022' and ` +
          `'false' respectively by the Angular CLI.`,
        location: { file: pluginOptions.tsconfig },
        notes: [
          {
            text:
              'To control ECMA version and features use the Browserslist configuration. ' +
              'For more information, see https://angular.dev/tools/cli/build#configuring-browser-compatibility',
          },
        ],
      })
    }

    if (compilerOptions.compilationMode === 'partial') {
      setupWarnings?.push({
        text: 'Angular partial compilation mode is not supported when building applications.',
        location: null,
        notes: [{ text: 'Full compilation mode will be used instead.' }],
      })
      compilerOptions.compilationMode = 'full'
    }

    // Enable incremental compilation by default if caching is enabled and incremental is not explicitly disabled
    if (
      compilerOptions.incremental !== false &&
      pluginOptions.sourceFileCache?.persistentCachePath
    ) {
      compilerOptions.incremental = true
      // Set the build info file location to the configured cache directory
      compilerOptions.tsBuildInfoFile = path.join(
        pluginOptions.sourceFileCache?.persistentCachePath,
        '.tsbuildinfo',
      )
    } else {
      compilerOptions.incremental = false
    }

    if (compilerOptions.module === undefined || compilerOptions.module < 5 /** ES2015 */) {
      compilerOptions.module = 7 /** ES2022 */
      setupWarnings?.push({
        text: `TypeScript compiler options 'module' values 'CommonJS', 'UMD', 'System' and 'AMD' are not supported.`,
        location: null,
        notes: [{ text: `The 'module' option will be set to 'ES2022' instead.` }],
      })
    }

    if (compilerOptions.isolatedModules && compilerOptions.emitDecoratorMetadata) {
      setupWarnings?.push({
        text: `TypeScript compiler option 'isolatedModules' may prevent the 'emitDecoratorMetadata' option from emitting all metadata.`,
        location: null,
        notes: [
          {
            text:
              `The 'emitDecoratorMetadata' option is not required by Angular` +
              'and can be removed if not explictly required by the project.',
          },
        ],
      })
    }

    // Synchronize custom resolve conditions.
    // Set if using the supported bundler resolution mode (bundler is the default in new projects)
    if (
      compilerOptions.moduleResolution === 100 /* ModuleResolutionKind.Bundler */ ||
      compilerOptions.module === 200 /** ModuleKind.Preserve */
    ) {
      compilerOptions.customConditions = customConditions
    }

    return {
      ...compilerOptions,
      noEmitOnError: false,
      composite: false,
      inlineSources: !!pluginOptions.sourcemap,
      inlineSourceMap: !!pluginOptions.sourcemap,
      sourceMap: undefined,
      mapRoot: undefined,
      sourceRoot: undefined,
      preserveSymlinks,
      externalRuntimeStyles: pluginOptions.externalRuntimeStyles,
      _enableHmr: !!pluginOptions.templateUpdates,
      supportTestBed: !!pluginOptions.includeTestMetadata,
      supportJitMode: !!pluginOptions.includeTestMetadata,
    }
  }
}

function bundleWebWorker(
  build: PluginBuild,
  pluginOptions: CompilerPluginOptions,
  workerFile: string,
) {
  try {
    return build.esbuild.buildSync({
      ...build.initialOptions,
      platform: 'browser',
      write: false,
      bundle: true,
      metafile: true,
      format: 'esm',
      entryNames: 'worker-[hash]',
      entryPoints: [workerFile],
      sourcemap: pluginOptions.sourcemap,
      // Zone.js is not used in Web workers so no need to disable
      supported: undefined,
      // Plugins are not supported in sync esbuild calls
      plugins: undefined,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'errors' in error && 'warnings' in error) {
      return error as BuildFailure
    }
    throw error
  }
}

function createMissingFileError(request: string, original: string, root: string): PartialMessage {
  const relativeRequest = path.relative(root, request)
  const error = {
    text: `File '${relativeRequest}' is missing from the TypeScript compilation.`,
    notes: [
      {
        text: `Ensure the file is part of the TypeScript program via the 'files' or 'include' property.`,
      },
    ],
  }

  const relativeOriginal = path.relative(root, original)
  if (relativeRequest !== relativeOriginal) {
    error.notes.push({
      text: `File is requested from a file replacement of '${relativeOriginal}'.`,
    })
  }

  return error

}

