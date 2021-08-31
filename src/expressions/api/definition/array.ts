import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { SpreadElement } from '../computing/spread.js';

@Deserializer('ArrayExpression')
export class ArrayExpression extends AbstractExpressionNode {
	static fromJSON(node: ArrayExpression, deserializer: NodeDeserializer): ArrayExpression {
		return new ArrayExpression(node.elements.map(expression => deserializer(expression)));
	}
	constructor(private elements: ExpressionNode[]) {
		super();
	}
	getElements() {
		return this.elements;
	}
	set(stack: Stack) {
		throw new Error("ArrayExpression#set() has no implementation.");
	}
	get(stack: Stack) {
		return this.elements.map(item => item.get(stack));
	}
	entry(): string[] {
		return this.elements.flatMap(item => item.entry());
	}
	event(parent?: string): string[] {
		return this.elements.flatMap(item => item.event());
	}
	toString() {
		return this.elements.map(item => item.toString()).toString();
	}
	toJson(): object {
		return {
			elements: this.elements.map(item => item.toJSON())
		};
	}
}


@Deserializer('ArrayPattern')
export class ArrayPattern extends AbstractExpressionNode {
	static fromJSON(node: ArrayPattern, deserializer: NodeDeserializer): ArrayPattern {
		return new ArrayPattern(node.elements.map(expression => deserializer(expression)));
	}
	constructor(private elements: ExpressionNode[]) {
		super();
	}
	getElements() {
		return this.elements;
	}
	set(stack: Stack, values: any[]) {
		for (let index = 0; index < this.elements.length; index++) {
			const elem = this.elements[index];
			if (elem instanceof SpreadElement) {
				const rest = values.slice(index);
				elem.set(stack, rest);
				break;
			}
			elem.set(stack, values[index]);
		}
	}
	get(scopeProvider: Stack, values: any[]) {
		this.set(scopeProvider, values);
	}
	entry(): string[] {
		return this.elements.flatMap(item => item.entry());
	}
	event(parent?: string): string[] {
		return this.elements.flatMap(item => item.event());
	}
	toString() {
		return this.elements.map(item => item.toString()).toString();
	}
	toJson(): object {
		return {
			elements: this.elements.map(item => item.toJSON())
		};
	}
}
