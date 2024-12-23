import { Directive, inject, InjectionToken, input, StaticProvider } from "@angular/core"

export const TAGS = new InjectionToken<string[]>('tags')

export function provideTags(tags: string[]): StaticProvider {
	return { provide: TAGS, useValue: tags }
}

@Directive({
	selector: '[tags]',
	providers: [
		{ provide: TAGS, useFactory: () => inject(Tags).tags }
	]
})
export class Tags {
	readonly tags = input.required<string[]>()
}
