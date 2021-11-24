import type {
	NodeDeserializer, ExpressionNode, CanDeclareExpression,
	ExpressionEventPath, VisitNodeType, VisitNodeListType
} from '../expression.js';
import type { Scope } from '../../scope/scope.js';
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
	static visit(node: ArrayExpression, visitNode: VisitNodeType, visitNodeList: VisitNodeListType): void {
		visitNodeList(node.elements);
	}
	constructor(private elements: ExpressionNode[]) {
		super();
	}
	getElements() {
		return this.elements;
	}
	shareVariables(scopeList: Scope<any>[]): void {
		this.elements.forEach(item => item.shareVariables(scopeList));
	}
	set(stack: Stack) {
		throw new Error("ArrayExpression#set() has no implementation.");
	}
	get(stack: Stack) {
		return this.elements.map(item => item.get(stack));
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.elements.flatMap(item => item.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.elements.flatMap(item => item.dependencyPath(computed));
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
export class ArrayPattern extends AbstractExpressionNode implements CanDeclareExpression {
	static fromJSON(node: ArrayPattern, deserializer: NodeDeserializer): ArrayPattern {
		return new ArrayPattern(node.elements.map(expression => deserializer(expression)) as CanDeclareExpression[]);
	}
	static visit(node: ArrayPattern, visitNode: VisitNodeType, visitNodeList: VisitNodeListType): void {
		visitNodeList(node.elements);
	}
	constructor(private elements: CanDeclareExpression[]) {
		super();
	}
	getElements() {
		return this.elements;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack, values: any) {
		throw new Error('ArrayPattern#set() has no implementation.');
	}
	get(scopeProvider: Stack) {
		throw new Error('ArrayPattern#get() has no implementation.');
	}
	declareVariable(stack: Stack, scopeType: ScopeType, values: any) {
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
	dependency(computed?: true): ExpressionNode[] {
		return this.elements.flatMap(item => item.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.elements.flatMap(item => item.dependencyPath(computed));
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
