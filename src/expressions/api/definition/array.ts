import type { NodeDeserializer, ExpressionNode, DeclareExpression } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { RestElement } from '../computing/rest.js';
import { ScopeType } from '../../scope/scope.js';

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
	events(parent?: string): string[] {
		return this.elements.flatMap(item => item.events());
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
export class ArrayPattern extends AbstractExpressionNode implements DeclareExpression {
	static fromJSON(node: ArrayPattern, deserializer: NodeDeserializer): ArrayPattern {
		return new ArrayPattern(node.elements.map(expression => deserializer(expression)) as DeclareExpression[]);
	}
	constructor(private elements: DeclareExpression[]) {
		super();
	}
	getElements() {
		return this.elements;
	}
	set(stack: Stack, values: any[]) {
		throw new Error('ArrayPattern#set() has no implementation.');
	}
	get(scopeProvider: Stack) {
		throw new Error('ArrayPattern#get() has no implementation.');
	}
	declareVariable(stack: Stack, scopeType: ScopeType, values: any[]) {
		if (Array.isArray(values)) {
			this.declareVariableFromArray(stack, scopeType, values);
		} else if (Reflect.has(values, Symbol.iterator)) {
			this.declareVariableFromIterator(stack, scopeType, values);
		}
	}
	declareVariableFromArray(stack: Stack, scopeType: ScopeType, values: any[]) {
		for (let index = 0; index < this.elements.length; index++) {
			const elem = this.elements[index];
			if (elem instanceof RestElement) {
				const rest = values.slice(index);
				elem.declareVariable(stack, 'block', rest);
				break;
			}
			elem.declareVariable(stack, 'block', values[index]);
		}
	}
	declareVariableFromIterator(stack: Stack, scopeType: ScopeType, iterator: Iterator<any>) {
		let index = 0;
		while (true) {
			let iteratorResult = iterator.next();
			if (iteratorResult.done) {
				break;
			}
			const elem = this.elements[index++];
			if (elem instanceof RestElement) {
				const rest = [iteratorResult.value];
				while (!iteratorResult.done) {
					iteratorResult = iterator.next();
					rest.push(iteratorResult.value);
				}
				elem.declareVariable(stack, 'block', rest);
				break;
			}
			elem.declareVariable(stack, 'block', iteratorResult.value);
			if (index >= this.elements.length) {
				break;
			}
		}
	}
	events(parent?: string): string[] {
		return this.elements.flatMap(item => item.events());
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
