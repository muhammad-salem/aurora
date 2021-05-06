import type { NodeDeserializer, ExpressionNode, NodeExpressionClass, NodeJsonType } from './expression.js';
import type { EvaluateNode } from './operators/types.js';
import type { AwaitPromiseInfo, ScopedStack } from './scope.js';

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
	abstract set(stack: ScopedStack, value: any): any;
	abstract get(stack: ScopedStack, thisContext?: any): any;
	abstract entry(): string[];
	abstract event(parent?: string): string[];
	abstract toString(): string;
	abstract toJson(key?: string): { [key: string]: any };
}

export abstract class InfixExpressionNode extends AbstractExpressionNode {
	constructor(protected op: string, protected left: ExpressionNode, protected right: ExpressionNode) {
		super();
	}
	getOperator() {
		return this.op;
	}
	getLeft() {
		return this.left;
	}
	getRight() {
		return this.right;
	}
	set(context: object, value: any) {
		throw new Error(`${this.constructor.name}#set() of (${this.op}) has no implementation.`);
	}
	get(stack: ScopedStack): any {
		const evalNode: EvaluateNode = {
			left: this.left.get(stack),
			right: this.right.get(stack)
		};
		return this.evalNode(evalNode);
	}
	abstract evalNode(evalNode: EvaluateNode): any;
	entry(): string[] {
		return [...this.left.entry(), ...this.right.entry()];
	}
	event(parent?: string): string[] {
		return [...this.left.event(), ...this.right.event()];
	}
	toString() {
		return `${this.left.toString()} ${this.op} ${this.right.toString()}`;
	}
	toJson(key: string): object {
		return {
			op: this.op,
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
	node: { set(stack: ScopedStack, value: any): any; };
	constructor(public promise: Promise<any>) { }
}
