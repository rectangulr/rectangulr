"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformTerminal = void 0;
const common_1 = require("@angular/common");
const compiler_1 = require("@angular/compiler");
const core_1 = require("@angular/core");
// import { platformBrowserDynamic as basePlatform } from '@angular/platform-browser-dynamic';
const platform_browser_1 = require("@angular/platform-browser");
const sanitizer_1 = require("./sanitizer");
const schema_registry_1 = require("./schema-registry");
const logger_1 = require("./logger");
const debug_1 = require("./debug");
exports.platformTerminal = core_1.createPlatformFactory(platform_browser_1.platformBrowser, 'terminal', [
    { provide: common_1.DOCUMENT, useValue: {} },
    { provide: core_1.Sanitizer, useClass: sanitizer_1.TerminalSanitizer, deps: [] },
    {
        provide: core_1.COMPILER_OPTIONS,
        useValue: {
            providers: [
                // Only used in JIT mode
                { provide: compiler_1.ElementSchemaRegistry, useClass: schema_registry_1.TerminalElementSchemaRegistry },
            ],
        },
        multi: true,
    },
]);
logger_1.patchGlobalConsole();
debug_1.addGlobalRgDebug();
