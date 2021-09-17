import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { SpreadElement } from './spread.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { MemberExpression } from '../definition/member.js';

@Deserializer('CallExpression')
export class CallExpression extends AbstractExpressionNode {
	static fromJSON(node: CallExpression, deserializer: NodeDeserializer): CallExpression {
		return new CallExpression(
			deserializer(node.callee),
			node.arguments.map(param => deserializer(param)),
			node.optional
		);
	}
	private arguments: ExpressionNode[];
	constructor(private callee: ExpressionNode, params: ExpressionNode[], private optional: boolean = false) {
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
		throw new Error(`CallExpression#set() has no implementation.`);
	}
	get(stack: Stack, thisContext?: any) {
		const funCallBack: Function = this.callee.get(stack) as Function;
		if (this.optional && (funCallBack === null || funCallBack === undefined)) {
			return;
		}
		const parameters: any[] = [];
		for (const arg of this.arguments) {
			if (arg instanceof SpreadElement) {
				const paramScope = stack.pushBlockScopeFor(parameters);
				arg.get(stack);
				stack.clearTo(paramScope);
				break;
			} else {
				parameters.push(arg.get(stack));
			}
		}
		if (!thisContext && this.callee instanceof MemberExpression) {
			thisContext = this.callee.getObject().get(stack);
		}
		return funCallBack.apply(thisContext, parameters);
	}
	events(parent?: string): string[] {
		return [...this.callee.events(), ...this.arguments.flatMap(arg => arg.events())];
	}
	toString(): string {
		return `${this.callee.toString()}${this.optional ? '?.' : ''}(${this.arguments.map(arg => arg.toString()).join(', ')})`;
	}
	toJson(): object {
		return {
			callee: this.callee.toJSON(),
			arguments: this.arguments.map(arg => arg.toJSON()),
			optional: this.optional
		};
	}
}
