import type { ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer('spread')
export class SpreadSyntaxNode extends AbstractExpressionNode {
	static KEYWORDS = ['...'];
	static fromJSON(nodeExp: SpreadSyntaxNode): SpreadSyntaxNode {
		return new SpreadSyntaxNode(nodeExp.node);
	}
	constructor(private node: ExpressionNode) {
		super();
	}
	getNode() {
		return this.node;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error('SpreadSyntax.set() Method has no implementation.');
	}
	get(stack: ScopedStack): void {
		const value = this.node.get(stack);
		if (Array.isArray(value)) {
			this.spreadFromArray(stack, value);
		} else if (Reflect.has(value, Symbol.iterator)) {
			this.spreadFromIterator(stack, value);
		} else {
			Object.keys(value).forEach(key => stack.localScop.set(key, value[key]));
		}
	}
	private spreadFromArray(stack: ScopedStack, array: Array<any>): void {
		let length: number = stack.get('length');
		array.forEach(value => stack.localScop.set(length++, value));
	}
	private spreadFromIterator(stack: ScopedStack, iterator: Iterator<any>): void {
		let length: number = stack.get('length');
		while (true) {
			const iteratorResult = iterator.next();
			if (iteratorResult.done) {
				break;
			}
			stack.localScop.set(length++, iteratorResult.value);
		}
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return `...${this.node.toString()}`;
	}
	toJson(): object {
		return { node: this.node.toJSON() };
	}
}
