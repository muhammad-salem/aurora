import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { ScopedStack } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { SpreadSyntaxNode } from './spread.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('call')
export class FunctionCallNode extends AbstractExpressionNode {
	static fromJSON(node: FunctionCallNode, deserializer: NodeDeserializer): FunctionCallNode {
		return new FunctionCallNode(deserializer(node.func), node.parameters.map(param => deserializer(param)));
	}
	constructor(private func: ExpressionNode, private parameters: ExpressionNode[]) {
		super();
	}
	getFunc() {
		return this.func;
	}
	getParameters() {
		return this.parameters;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`FunctionCallNode#set() has no implementation.`);
	}
	get(stack: ScopedStack, thisContext?: any) {
		const funCallBack = this.func.get(thisContext ? stack.stackFor(thisContext) : stack) as Function;
		const parameters = this.parameters
			.filter(param => !(param instanceof SpreadSyntaxNode))
			.map(param => param.get(stack));
		const spreadParam = this.parameters[this.parameters.length - 1];
		if (spreadParam instanceof SpreadSyntaxNode) {
			const spreadArray = spreadParam.getNode().get(stack);
			return funCallBack.call(thisContext, ...parameters, ...spreadArray);
		}
		return funCallBack.call(thisContext, ...parameters);
	}
	entry(): string[] {
		return [...this.func.entry(), ...this.parameters.flatMap(param => param.entry())];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return `${this.func.toString()}(${this.parameters.map(param => param.toString()).join(', ')})`;
	}
	toJson(): object {
		return {
			func: this.func.toJSON(),
			parameters: this.parameters.map(param => param.toJSON())
		};
	}
}
