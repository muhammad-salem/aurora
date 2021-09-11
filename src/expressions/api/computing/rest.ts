import type { DeclareExpression, ExpressionNode, NodeDeserializer } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopeType } from '../../index.js';

@Deserializer('RestElement')
export class RestElement extends AbstractExpressionNode implements DeclareExpression {
	static fromJSON(node: RestElement, deserializer: NodeDeserializer): RestElement {
		return new RestElement(deserializer(node.argument) as DeclareExpression);
	}
	constructor(private argument: DeclareExpression) {
		super();
	}
	getArgument() {
		return this.argument;
	}
	set(stack: Stack, value: any) {
		throw new Error('RestElement#set() Method has no implementation.');
	}
	get(stack: Stack): void {
		throw new Error('RestElement#get() Method has no implementation.');
	}
	declareVariable(stack: Stack, scopeType: ScopeType, propertyValue?: any): any {
		let restValue: any;
		if (Array.isArray(propertyValue)) {
			restValue = this.getFromArray(stack, propertyValue);
		} else if (Reflect.has(propertyValue, Symbol.iterator)) {
			restValue = this.getFromIterator(stack, propertyValue);
		} else {
			restValue = this.getFromObject(stack, propertyValue);
		}
		this.argument.declareVariable(stack, 'block', restValue);
	}
	private getFromArray(stack: Stack, array: Array<any>) {
		const length: number = stack.get('length');

		return array.slice(length);
	}
	private getFromIterator(stack: Stack, iterator: Iterator<any>) {
		const restArray = [];
		while (true) {
			const iteratorResult = iterator.next();
			if (iteratorResult.done) {
				break;
			}
			restArray.push(iteratorResult.value);
		}
		return restArray;
	}
	private getFromObject(stack: Stack, objectValue: { [key: PropertyKey]: any }) {
		const context = stack.lastScope<typeof objectValue>().getContext()!;
		const keys: PropertyKey[] = [];
		keys.push(...Object.keys(objectValue));
		keys.push(...Object.getOwnPropertySymbols(objectValue));
		const restObject: typeof objectValue = {};
		for (const key of keys) {
			if (!(key in context)) {
				restObject[key] = objectValue[key];
			}
		}
		return restObject;
	}
	events(parent?: string): string[] {
		return this.argument.events();
	}
	toString(): string {
		return `...${this.argument.toString()}`;
	}
	toJson(): object {
		return { argument: this.argument.toJSON() };
	}
}
