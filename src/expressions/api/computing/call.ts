import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { StackProvider } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { SpreadNode } from './spread.js';
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
	set(stack: StackProvider, value: any) {
		throw new Error(`FunctionCallNode#set() has no implementation.`);
	}
	get(stack: StackProvider, thisContext?: any) {
		const funCallBack = this.func.get(thisContext ? stack.stackFor(thisContext) : stack) as Function;
		const parameters: any[] = [];
		const parametersStack = stack.emptyScopeFor(parameters);
		for (const arg of this.parameters) {
			if (arg instanceof SpreadNode) {
				arg.get(parametersStack);
			} else {
				parameters.push(arg.get(stack));
			}
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
