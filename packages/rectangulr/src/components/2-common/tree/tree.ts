import { NgTemplateOutlet } from '@angular/common'
import { Component, EventEmitter, Output, TemplateRef, effect, input, viewChild, contentChild, inject } from '@angular/core'
import { Subject } from 'rxjs'
import { FocusDirective } from '../../../commands/focus.directive'
import { Command, ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { signal2 } from '../../../utils/Signal2'
import { StyleDirective } from '../../1-basics/style'
import { List } from '../list/list'
import { ListItem } from '../list/list-item'
import { TreeNode } from './tree-node'

export interface NodeData { name: any, children: any[] }

@Component({
    selector: 'tree',
    template: `
		@if (!multi()) {
		  <ng-container
		    [ngTemplateOutlet]="nodeTemplate() || nodeTemplate2() || defaultTemplate"
		    [ngTemplateOutletContext]="{$implicit: node, selected: shortcutService.isFocused(), expanded: expanded }"/>
		  @if (expanded) {
		    <list
		      [items]="nodes()"
		      [focusIf]="focused() == 'children'"
		      [styleItem]="false">
		      <tree *item="let node" focus [nodes]="node.children" [nodeTemplate]="nodeTemplate() || nodeTemplate2() || defaultTemplate" [level]="level()" [s]="{ marginLeft: 1 }" (selectedItem)="$$selectedItem.emit($event)" />
		    </list>
		  }
		}

		<ng-template #defaultTemplate let-item let-selected>
		  {{item.name}}
		</ng-template>

		@if (multi()) {
		  <list
		    [items]="nodes()"
		    [focusIf]="focused() == 'children'"
		    [styleItem]="false">
		    <tree *item="let node" focus [nodes]="node" [nodeTemplate]="nodeTemplate() || nodeTemplate2() || defaultTemplate" [level]="level() + 1" (selectedItem)="$$selectedItem.emit($event)" />
		  </list>
		}
	`,
    imports: [List, ListItem, FocusDirective, NgTemplateOutlet, StyleDirective]
})
export class Tree<T> {
	shortcutService = inject(ShortcutService)

	readonly nodes = input.required<(T & NodeData)[]>()
	readonly level = input(0)
	readonly nodeTemplate = input<TemplateRef<any>>(undefined)

	@Output('selectedItem') $$selectedItem = new EventEmitter()

	readonly node = signal2<T & NodeData | null>(null)
	readonly focused = signal2<'self' | 'children'>('self')
	readonly canExpand = signal2(false)
	readonly expanded = signal2(false)
	readonly multi = signal2(false)

	readonly list = viewChild(List)
	readonly nodeTemplate2 = contentChild(TreeNode, { read: TemplateRef })

	constructor() {
		const shortcutService = this.shortcutService

		registerShortcuts(this.shortcuts)
		effect(() => {
			if (shortcutService.isFocused()) {
				this.$$selectedItem.emit(this.nodes())
			}
		})
	}

	ngOnInit() {
		this.multi.$ = Array.isArray(this.nodes())
		const nodes = this.nodes()
		if (Array.isArray(nodes)) {
			//
		} else {
			this.node.$ = nodes
			this.canExpand.$ = this.node().children && this.node().children.length > 0
		}
	}

	shortcuts: Partial<Command>[] = [
		{
			keys: 'left',
			func: key => {
				if (this.focused() == 'children') {
					this.focused.$ = 'self'
				} else {
					if (this.expanded) {
						this.expanded.$ = false
					} else {
						return key
					}
				}
			},
		},
		{
			keys: 'right',
			func: key => {
				if (!this.canExpand) return key

				if (this.focused() == 'self') {
					if (!this.expanded) {
						this.expanded.$ = true
					} else {
						this.focused.$ = 'children'
					}
				} else if (this.focused() == 'children') {
					return key
				}
			},
		},
		{
			keys: 'up',
			func: key => {
				if (this.focused() == 'children') {
					this.focused.$ = 'self'
				} else if (this.focused() == 'self') {
					return key
				}
			},
		},
		{
			keys: 'down',
			func: key => {
				if (this.focused() == 'self') {
					if (this.expanded) {
						this.focused.$ = 'children'
					} else {
						return key
					}
				} else if (this.focused() == 'children') {
					return key
				}
			},
		},
	]

	arrow(): string {
		if (this.canExpand) {
			return this.expanded ? '˅' : '>'
		} else {
			return ' '
		}
	}

	s = {
		selected: { backgroundColor: 'gray' },
	}
}
