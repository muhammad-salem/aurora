import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { SpreadElement } from '../computing/spread.js';

/**
 * pipeline ('|>') operator support syntax:
 *  param |> func
 *  param |> func:arg1:arg2:arg3
 *  param |> func:arg1:?:arg3
 *  param |> func:arg1:?:arg3:?:arg5
 * 
 *  param |> func(arg1, arg2, arg3)
 *  param |> func(arg1, ?, arg3)
 *  param |> func(arg1, ?, arg3, arg4, ?, arg6)
 */
@Deserializer('PipelineExpression')
export class PipelineExpression extends AbstractExpressionNode {
	static fromJSON(node: PipelineExpression, deserializer: NodeDeserializer): PipelineExpression {
		return new PipelineExpression(
			deserializer(node.left),
			deserializer(node.right),
			node.params.map(param => typeof param === 'string' ? param : deserializer(param))
		);
	}
	constructor(private left: ExpressionNode, private right: ExpressionNode, private params: (ExpressionNode | '?' | '...?')[] = []) {
		super();
	}
	getLeft() {
		return this.left;
	}
	getRight() {
		return this.right;
	}
	getParams() {
		return this.params;
	}
	set(stack: Stack, value: any) {
		throw new Error(`PipelineNode#set() has no implementation.`);
	}
	get(stack: Stack, thisContext?: any) {
		const paramValue = this.left.get(stack);
		const funCallBack = this.right.get(stack, thisContext) as Function;
		const parameters: any[] = [];
		// const parametersStack = stack.emptyStackProviderWith(parameters);
		let indexed = false;
		for (const arg of this.params) {
			if (arg === '?') {
				parameters.push(paramValue);
				indexed = true;
			} else if (arg === '...?') {
				parameters.push(...paramValue);
				indexed = true;
			} else {
				if (arg instanceof SpreadElement) {
					stack.pushBlockScopeFor(parameters);
					arg.get(stack);
					stack.popScope();
				} else {
					parameters.push(arg.get(stack));
				}
			}
		}
		if (indexed) {
			return funCallBack.call(thisContext, ...parameters);
		}
		return funCallBack.call(thisContext, paramValue, ...parameters);
	}
	events(parent?: string): string[] {
		return [
			...this.right.events(),
			...this.left.events(),
			...(this.params.filter(param => (param !== '?' && param !== '...?')) as ExpressionNode[]).flatMap(param => param.events!())
		];
	}
	toString() {
		return `${this.left.toString()} |> ${this.right.toString()}${this.params.flatMap(param => `:${param.toString()}`).join('')}`;
	}
	toJson(): object {
		return {
			left: this.left.toJSON(),
			right: this.right.toJSON(),
			params: this.params?.map(param => typeof param === 'string' ? param : param.toJSON())
		};
	}
}
