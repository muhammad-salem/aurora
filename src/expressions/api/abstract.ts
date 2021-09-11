import type { ScopeType } from '../scope/scope.js';
import type { AwaitPromiseInfo, Stack } from '../scope/stack.js';
import type {
	NodeDeserializer, ExpressionNode,
	NodeExpressionClass, NodeJsonType,
	DeclareExpression
} from './expression.js';

export abstract class AbstractExpressionNode implements ExpressionNode {
	static fromJSON(node: ExpressionNode, deserializer: NodeDeserializer): ExpressionNode {
		return deserializer(node as any);
	}
	getClass(): NodeExpressionClass<ExpressionNode> {
		return this.constructor as NodeExpressionClass<ExpressionNode>;
	}
	toJSON(key?: string): NodeJsonType {
		const json = this.toJson(key) as NodeJsonType;
		json.type = Reflect.get(this.constructor, 'type');
		return json;
	}
	abstract set(stack: Stack, value: any): any;
	abstract get(stack: Stack, thisContext?: any): any;
	abstract events(parent?: string): string[];
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
	abstract get(stack: Stack): any;
	events(parent?: string): string[] {
		return [...this.left.events(), ...this.right.events()];
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
	node: DeclareExpression;
	declareVariable: boolean;
	scopeType: ScopeType;
	constructor(public promise: Promise<any>) { }
}
