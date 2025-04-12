/**
 * Exhaustive switch statements.
 * @example
 * ```ts
 * enum Direction { Up, Down }
 *
 * function move(direction: Direction) {
 * 	switch (direction) {
 * 		case Direction.Up:
 * 			return 'Moving up';
 * 		case Direction.Down:
 * 			return 'Moving down';
 * 		default:
 * 			return assertUnreachable(direction);
 * 	}
 */
export function assertUnreachable(x: never): never {
	throw new Error(`assertUnreachable: ${x}`)
}