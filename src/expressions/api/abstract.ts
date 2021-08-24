import type { NodeDeserializer, ExpressionNode, NodeExpressionClass, NodeJsonType } from './expression.js';
import { AwaitPromiseInfo, AwaitPromiseInfoNode, ScopeType, StackProvider } from './scope.js';

export abstract class AbstractExpressionNode implements ExpressionNode {
	static fromJSON(node: ExpressionNode, deserializer: NodeDeserializer): ExpressionNode {
		return deserializer(node as any);
	}
	getClass(): NodeExpressionClass<ExpressionNode> {
		return this.constructor as NodeExpressionClass<ExpressionNode>;
	}
	toJSON(key?: string): NodeJsonType {
		return Object.assign(
			{ type: Reflect.get(this.constructor, 'type') },
			this.toJson(key) as NodeJsonType
		);
	}
	abstract set(stack: StackProvider, value: any): any;
	abstract get(stack: StackProvider, thisContext?: any): any;
	abstract entry(): string[];
	abstract event(parent?: string): string[];
	abstract toString(): string;
	abstract toJson(key?: string): { [key: string]: any };
}
export abstract class InfixExpressionNode<T> extends AbstractExpressionNode {
	constructor(protected operator: T, protected left: ExpressionNode, protected right: ExpressionNode) {
		super();
	}
	getOperator() {
		return this.operator;
	}
	getLeft() {
		return this.left;
	}
	getRight() {
		return this.right;
	}
	set(context: object, value: any) {
		throw new Error(`${this.constructor.name}#set() of operator: '${this.operator}' has no implementation.`);
	}
	abstract get(stack: StackProvider): any;
	entry(): string[] {
		return [...this.left.entry(), ...this.right.entry()];
	}
	event(parent?: string): string[] {
		return [...this.left.event(), ...this.right.event()];
	}
	toString() {
		return `${this.left.toString()} ${this.operator} ${this.right.toString()}`;
	}
	toJson(key: string): object {
		return {
			op: this.operator,
			left: this.left.toJSON(),
			right: this.right.toJSON()
		};
	}
}

export class ReturnValue {
	constructor(public value: any) { }
	getValue() {
		return this.value;
	}
}

export class AwaitPromise implements AwaitPromiseInfo {
	node: AwaitPromiseInfoNode;
	declareVariable: boolean;
	scopeType: ScopeType;
	constructor(public promise: Promise<any>) { }
}
