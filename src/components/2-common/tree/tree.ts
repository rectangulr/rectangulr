import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef, ViewChild, effect, signal } from '@angular/core'
import { Subject } from 'rxjs'
import { makeRuleset } from '../../../angular-terminal/dom-terminal'
import { Command, ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { HBox } from "../../1-basics/box"
import { List } from '../list/list'
import { ListItem } from '../list/list-item'
import { FocusDirective } from '../../../commands/focus.directive'
import { Json5Pipe } from "../json5.pipe"
import { NgComponentOutlet, NgIf, NgTemplateOutlet } from '@angular/common'
import { TreeNode } from './tree-node'
import { StyleDirective } from '../../1-basics/style'

export interface NodeData { name: any, children: any[] }

@Component({
	selector: 'tree',
	standalone: true,
	template: `
		<ng-container *ngIf="!multi">
			<ng-container
				[ngTemplateOutlet]="nodeTemplate || nodeTemplate2 || defaultTemplate"
				[ngTemplateOutletContext]="{$implicit: node, selected: shortcutService.$isFocused(), expanded: expanded }"/>

			<ng-container *ngIf="expanded">
				<list
					[items]="nodes"
					[focusIf]="focused == 'children'"
					[styleItem]="false">
					<tree *item="let node" focus [nodes]="node.children" [nodeTemplate]="nodeTemplate || nodeTemplate2 || defaultTemplate" [level]="level" [s]="{ marginLeft: 1 }" (selectedItem)="$$selectedItem.emit($event)" />
				</list>
			</ng-container>
		</ng-container>

		<ng-template #defaultTemplate let-item let-selected>
			{{item.name}}
		</ng-template>

		<ng-container *ngIf="multi">
			<list
				[items]="nodes"
				[focusIf]="focused == 'children'"
				[styleItem]="false">
				<tree *item="let node" focus [nodes]="node" [nodeTemplate]="nodeTemplate || nodeTemplate2 || defaultTemplate" [level]="level + 1" (selectedItem)="$$selectedItem.emit($event)" />
			</list>
		</ng-container>
  	`,
	imports: [NgIf, List, ListItem, HBox, FocusDirective, Json5Pipe, NgComponentOutlet, NgTemplateOutlet, StyleDirective]
})
export class Tree<T> {
	@Input({ required: true }) nodes: (T & NodeData)[]
	@Input() level = 0
	@Input() nodeTemplate: TemplateRef<any> = undefined
	@Output('selectedItem') $$selectedItem = new EventEmitter()

	node: T & NodeData
	focused: 'self' | 'children' = 'self'
	canExpand = false
	expanded = false
	multi = false

	$selectedItem = signal(null)

	@ViewChild(List) list: List<any>
	@ContentChild(TreeNode, { read: TemplateRef, static: true }) nodeTemplate2: TemplateRef<any>

	constructor(public shortcutService: ShortcutService) {
		registerShortcuts(this, this.shortcuts)
		effect(() => {
			if (shortcutService.$isFocused()) {
				this.$$selectedItem.emit(this.nodes)
			}
		})
	}

	ngOnInit() {
		this.multi = Array.isArray(this.nodes)
		if (Array.isArray(this.nodes)) {
			//
		} else {
			this.node = this.nodes
			this.canExpand = this.node.children && this.node.children.length > 0
		}
	}

	shortcuts: Partial<Command>[] = [
		{
			keys: 'left',
			func: key => {
				if (this.focused == 'children') {
					this.focused = 'self'
				} else {
					if (this.expanded) {
						this.expanded = false
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

				if (this.focused == 'self') {
					if (!this.expanded) {
						this.expanded = true
					} else {
						this.focused = 'children'
					}
				} else if (this.focused == 'children') {
					return key
				}
			},
		},
		{
			keys: 'up',
			func: key => {
				if (this.focused == 'children') {
					this.focused = 'self'
				} else if (this.focused == 'self') {
					return key
				}
			},
		},
		{
			keys: 'down',
			func: key => {
				if (this.focused == 'self') {
					if (this.expanded) {
						this.focused = 'children'
					} else {
						return key
					}
				} else if (this.focused == 'children') {
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
		selected: makeRuleset({ backgroundColor: 'gray' }),
	}

	destroy$ = new Subject(); ngOnDestroy() { this.destroy$.next(null); this.destroy$.complete() }
}
