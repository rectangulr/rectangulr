import { Directive, input } from '@angular/core'
import { Observable } from 'rxjs'

@Directive({
	standalone: true,
	selector: '[treeNode]',
})
export class TreeNode<T> {
	readonly treeNodeType = input<T | T[] | Observable<T[]>>(undefined)

	static ngTemplateContextGuard<T>(
		directive: TreeNode<T>,
		context: any
	): context is {
		$implicit: T,
		expanded: boolean,
		canExpand: boolean,
		selected: boolean,
	} {
		return true
	}
}
