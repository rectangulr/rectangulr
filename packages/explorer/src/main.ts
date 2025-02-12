import { Component, computed, inject, input, resource, viewChild } from '@angular/core'
import { AppShell, bootstrapApplication, Command, ɵcomputed2 as computed2, DomLogDirective, FocusDirective, GrowDirective, H, List, ListItem, Logs, provideView, registerShortcuts, ScrollDirective, ɵsignal2 as signal2, StyleDirective, Tasks, TermScreen, VGrowDirective } from '@rectangulr/rectangulr'
import { Dirent, Stats } from 'fs'
import fs from 'fs/promises'

@Component({
	template: `
		<h [s]="S().title">Explorer: {{dir()}}</h>
		<h grow>
			<list [items]="files()"
				  (selectedItem)="selectedFile.$ = $event"
				  [s]="{width: '33%'}"
				  focus>
				<h *item="let file; type: files()"
					>{{file.isDirectory() ? '>' : ' '}}{{file.name}}
				</h>
			</list>
			<h scroll focus [s]="{width: '67%', borderLeftCharacter: '|'}"
				>{{selectedFileContent()}}
			</h>
		</h>
	`,
	hostDirectives: [GrowDirective],
	standalone: true,
	imports: [H, List, ListItem, StyleDirective, FocusDirective, ScrollDirective, GrowDirective, VGrowDirective, DomLogDirective]
})
export class Main {
	tasks = inject(Tasks)
	navigationStack = signal2<string[]>([process.cwd()])
	dir = computed<string>(() => this.navigationStack().join('/') || '')
	dirFiles = resource({
		request: () => this.dir(),
		loader: async ({ request: dir }) => {
			return await fs.readdir(dir, { withFileTypes: true })
		}
	})
	files = computed<Dirent[]>(() => this.dirFiles.value() ?? [])

	list = viewChild<List<Dirent>>(List)
	selectedFile = signal2<Dirent | undefined>(undefined)
	selectedFilePath = computed2<string>(() => this.dir() + '/' + (this.selectedFile.$?.name ?? ''))
	selectedFileContent = signal2('')

	constructor() {
		// inject(TermScreen).debugPaintRects = true
		this.selectedFile.subscribe(file => {
			if (!file) return
			const path = this.selectedFilePath()

			this.tasks.queueOnce({
				name: 'preview',
				debounce: Tasks.work,
				func: async () => {
					const stat = await fs.stat(path)
					this.selectedFileContent.$ = await filePreview(file, path, stat)
				}
			})
		})

		async function filePreview(file: Dirent, path: string, stat: Stats) {
			if (file.isDirectory()) {
				return 'Directory'
			}
			// > 1Mo
			if (stat.size > 1024 * 1024) {
				return 'File too big'
			}
			return (await fs.readFile(path, 'utf-8')).replaceAll('\t', '  ')
		}

		registerShortcuts(this.shortcuts)
	}

	shortcuts: Partial<Command>[] = [
		{
			keys: 'enter',
			func: () => {
				if (this.selectedFile.$ && this.selectedFile.$.isDirectory()) {
					this.navigationStack.$ = [...this.navigationStack(), this.selectedFile.$.name]
				}
			}
		}, {
			keys: 'backspace',
			func: () => {
				if (this.navigationStack().length > 1) {
					this.navigationStack.$ = this.navigationStack().slice(0, -1)
				}
			}
		}
	]

	S = input({
		title: { backgroundColor: 'white', color: 'black', hgrow: true },
		// file: (f: Dirent) => f.isDirectory() ? { backgroundColor: 'grey' } : {}
	})
}

bootstrapApplication(AppShell, {
	providers: [
		provideView({ name: 'Files', component: Main }),
		provideView({ name: 'Logs', component: Logs, tags: ['hidden'] }),
	]
}).catch((err) => console.error(err))
