import type { ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { StackProvider } from '../scope.js';

@Deserializer('spread')
export class SpreadNode extends AbstractExpressionNode {
	static fromJSON(nodeExp: SpreadNode): SpreadNode {
		return new SpreadNode(nodeExp.node);
	}
	constructor(private node: ExpressionNode) {
		super();
	}
	getNode() {
		return this.node;
	}
	set(stack: StackProvider, value: any) {
		throw new Error('SpreadSyntax.set() Method has no implementation.');
	}
	get(stack: StackProvider): void {
		const value = this.node.get(stack);
		if (Array.isArray(value)) {
			this.spreadFromArray(stack, value);
		} else if (Reflect.has(value, Symbol.iterator)) {
			this.spreadFromIterator(stack, value);
		} else {
			Object.keys(value).forEach(key => stack.localScop.set(key, value[key]));
		}
	}
	private spreadFromArray(stack: StackProvider, array: Array<any>): void {
		let length: number = stack.get('length');
		array.forEach(value => stack.localScop.set(length++, value));
	}
	private spreadFromIterator(stack: StackProvider, iterator: Iterator<any>): void {
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
