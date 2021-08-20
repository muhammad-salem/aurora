import type { ExpressionNode, NodeDeserializer } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { StackProvider } from '../scope.js';

@Deserializer('SpreadElement')
export class SpreadNode extends AbstractExpressionNode {
	static fromJSON(node: SpreadNode, deserializer: NodeDeserializer): SpreadNode {
		return new SpreadNode(deserializer(node.argument));
	}
	constructor(private argument: ExpressionNode) {
		super();
	}
	getArgument() {
		return this.argument;
	}
	set(stack: StackProvider, value: any) {
		throw new Error('SpreadNode.set() Method has no implementation.');
	}
	get(stack: StackProvider): void {
		const value = this.argument.get(stack);
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
		return this.argument.entry();
	}
	event(parent?: string): string[] {
		return this.argument.event();
	}
	toString(): string {
		return `...${this.argument.toString()}`;
	}
	toJson(): object {
		return { argument: this.argument.toJSON() };
	}
}
