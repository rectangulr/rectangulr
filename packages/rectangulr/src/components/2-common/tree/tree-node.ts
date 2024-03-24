import { Directive, Input } from '@angular/core'
import { Observable } from 'rxjs'

@Directive({
	standalone: true,
	selector: '[treeNode]',
})
export class TreeNode<T> {
	@Input() treeNodeType: T | T[] | Observable<T[]>

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
