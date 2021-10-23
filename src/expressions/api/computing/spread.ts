import type { ExpressionEventPath, ExpressionNode, NodeDeserializer } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('SpreadElement')
export class SpreadElement extends AbstractExpressionNode {
	static fromJSON(node: SpreadElement, deserializer: NodeDeserializer): SpreadElement {
		return new SpreadElement(deserializer(node.argument));
	}
	constructor(private argument: ExpressionNode) {
		super();
	}
	getArgument() {
		return this.argument;
	}
	shareVariables(scopeList: Scope<any>[]): void {
		this.argument.shareVariables(scopeList);
	}
	set(stack: Stack, value: any) {
		throw new Error('SpreadElement#set() Method has no implementation.');
	}
	get(stack: Stack): void {
		const value = this.argument.get(stack);
		if (Array.isArray(value)) {
			this.spreadFromArray(stack, value);
		} else if (Reflect.has(value, Symbol.iterator)) {
			this.spreadFromIterator(stack, value);
		}
	}
	private spreadFromArray(stack: Stack, array: Array<any>): void {
		let length: number = stack.get('length');
		array.forEach(value => stack.declareVariable('block', length++, value));
	}
	private spreadFromIterator(stack: Stack, iterator: Iterator<any>): void {
		let length: number = stack.get('length');
		while (true) {
			const iteratorResult = iterator.next();
			if (iteratorResult.done) {
				break;
			}
			stack.declareVariable('block', length++, iteratorResult.value);
		}
	}
	dependency(): ExpressionNode[] {
		return this.argument.dependency();
	}
	dependencyPath(computed: true): ExpressionEventPath[] {
		return this.argument.dependencyPath(computed);
	}
	toString(): string {
		return `...${this.argument.toString()}`;
	}
	toJson(): object {
		return { argument: this.argument.toJSON() };
	}
}
