import type {
	NodeDeserializer, ExpressionNode, DeclarationExpression,
	ExpressionEventPath, VisitNodeType
} from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { RestElement } from '../computing/rest.js';
import { SpreadElement } from '../computing/spread.js';

@Deserializer('ArrayExpression')
export class ArrayExpression extends AbstractExpressionNode {
	static fromJSON(node: ArrayExpression, deserializer: NodeDeserializer): ArrayExpression {
		return new ArrayExpression(node.elements.map(element => element ? deserializer(element) : null));
	}
	static visit(node: ArrayExpression, visitNode: VisitNodeType): void {
		node.elements.forEach(element => element && visitNode(element));
	}
	constructor(private elements: (ExpressionNode | SpreadElement | null)[]) {
		super();
	}
	getElements() {
		return this.elements;
	}
	set(stack: Stack) {
		throw new Error("ArrayExpression#set() has no implementation.");
	}
	get(stack: Stack) {
		return this.elements.map(item => item?.get(stack));
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.elements.filter(item => item).flatMap(item => item!.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.elements.filter(item => item).flatMap(item => item!.dependencyPath(computed));
	}
	toString() {
		return `[ ${this.elements.map(item => item?.toString()).toString()} ]`;
	}
	toJson(): object {
		return {
			elements: this.elements.map(item => item?.toJSON())
		};
	}
}


@Deserializer('ArrayPattern')
export class ArrayPattern extends AbstractExpressionNode implements DeclarationExpression {
	static fromJSON(node: ArrayPattern, deserializer: NodeDeserializer): ArrayPattern {
		return new ArrayPattern(node.elements.map(expression => expression ? deserializer(expression) : null) as DeclarationExpression[]);
	}
	static visit(node: ArrayPattern, visitNode: VisitNodeType): void {
		node.elements.forEach(expression => expression && visitNode(expression));
	}
	constructor(private elements: (DeclarationExpression | null)[]) {
		super();
	}
	getElements() {
		return this.elements;
	}
	set(stack: Stack, values: any) {
		throw new Error('ArrayPattern#set() has no implementation.');
	}
	get(scopeProvider: Stack) {
		throw new Error('ArrayPattern#get() has no implementation.');
	}
	declareVariable(stack: Stack, values: any) {
		if (Array.isArray(values)) {
			this.declareVariableFromArray(stack, values);
		} else if (Reflect.has(values, Symbol.iterator)) {
			this.declareVariableFromIterator(stack, values);
		}
	}
	declareVariableFromArray(stack: Stack, values: any[]) {
		for (let index = 0; index < this.elements.length; index++) {
			const elem = this.elements[index];
			if (elem == null) {
				continue;
			}
			if (elem instanceof RestElement) {
				const rest = values.slice(index);
				elem.declareVariable(stack, rest);
				break;
			}
			elem.declareVariable(stack, values[index]);
		}
	}
	declareVariableFromIterator(stack: Stack, iterator: Iterator<any>) {
		let index = 0;
		while (true) {
			let iteratorResult = iterator.next();
			if (iteratorResult.done) {
				break;
			}
			const elem = this.elements[index++];
			if (elem == null) {
				continue;
			}
			if (elem instanceof RestElement) {
				const rest = [iteratorResult.value];
				while (!iteratorResult.done) {
					iteratorResult = iterator.next();
					rest.push(iteratorResult.value);
				}
				elem.declareVariable(stack, rest);
				break;
			}
			elem.declareVariable(stack, iteratorResult.value);
			if (index >= this.elements.length) {
				break;
			}
		}
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.elements.filter(item => item).flatMap(item => item!.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.elements.filter(item => item).flatMap(item => item!.dependencyPath(computed));
	}
	toString() {
		return `[ ${this.elements.map(item => item?.toString()).toString()} ]`;
	}
	toJson(): object {
		return {
			elements: this.elements.map(item => item?.toJSON())
		};
	}
}
