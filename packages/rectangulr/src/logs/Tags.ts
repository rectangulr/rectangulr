import { Directive, inject, Injectable, InjectionToken, input, signal } from "@angular/core"

export const TAGS = new InjectionToken<string[]>('tags')

@Injectable()
export class TagsService {
	tags = signal<Set<string>>(new Set<string>(), { equal: (a, b) => false })
}

@Directive({
	selector: '[tags]',
	providers: [
		{ provide: TagsService },
		{ provide: TAGS, useFactory: () => inject(TagsService).tags().values() },
	],
	standalone: true,
})
export class TagsDirective {
	readonly tags = input.required<string[]>()
	tagsService = inject(TagsService)

	ngOnInit() {
		this.tagsService.tags.update(serviceTags => {
			for (const tag of this.tags()) {
				serviceTags.add(tag)
			}
			return serviceTags
		})
	}
}
