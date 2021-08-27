import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { Stack } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { SpreadNode } from './spread.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('CallExpression')
export class CallExpressionNode extends AbstractExpressionNode {
	static fromJSON(node: CallExpressionNode, deserializer: NodeDeserializer): CallExpressionNode {
		return new CallExpressionNode(deserializer(node.callee), node.arguments.map(param => deserializer(param)));
	}
	private arguments: ExpressionNode[];
	constructor(private callee: ExpressionNode, params: ExpressionNode[]) {
		super();
		this.arguments = params;
	}
	getCallee() {
		return this.callee;
	}
	getParameters() {
		return this.arguments;
	}
	set(stack: Stack, value: any) {
		throw new Error(`FunctionCallNode#set() has no implementation.`);
	}
	get(stack: Stack, thisContext?: any) {
		let funCallBack: Function;
		if (!thisContext) {
			funCallBack = this.callee.get(stack) as Function;
		} else {
			stack.pushBlockScopeFor(thisContext);
			funCallBack = this.callee.get(stack) as Function;
			stack.popScope();
		}
		const parameters: any[] = [];
		for (const arg of this.arguments) {
			if (arg instanceof SpreadNode) {
				stack.pushBlockScopeFor(parameters);
				arg.get(stack);
				stack.popScope();
				break;
			} else {
				parameters.push(arg.get(stack));
			}
		}
		return funCallBack.call(thisContext, ...parameters);
	}
	entry(): string[] {
		return [...this.callee.entry(), ...this.arguments.flatMap(arg => arg.entry())];
	}
	event(parent?: string): string[] {
		return [...this.callee.event(), ...this.arguments.flatMap(arg => arg.event())];
	}
	toString(): string {
		return `${this.callee.toString()}(${this.arguments.map(arg => arg.toString()).join(', ')})`;
	}
	toJson(): object {
		return {
			callee: this.callee.toJSON(),
			arguments: this.arguments.map(arg => arg.toJSON())
		};
	}
}
