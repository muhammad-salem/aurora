import type { NodeDeserializer, ExpressionNode, DependencyVariables } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { SpreadElement } from '../computing/spread.js';
import { MemberExpression } from '../definition/member.js';

/**
 * pipeline ('|>') operator support syntax:
 *  param |> func
 *  param |> func:arg1:arg2:arg3
 *  param |> func:arg1:?:arg3
 *  param |> func:arg1:?:arg3:?:arg5
 *  param |> func:arg1:...?:arg3
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
			node.arguments.map(arg => typeof arg === 'string' ? arg : deserializer(arg))
		);
	}
	private arguments: (ExpressionNode | '?' | '...?')[];
	constructor(private left: ExpressionNode, private right: ExpressionNode, params: (ExpressionNode | '?' | '...?')[] = []) {
		super();
		this.arguments = params;
	}
	getLeft() {
		return this.left;
	}
	getRight() {
		return this.right;
	}
	getArguments() {
		return this.arguments;
	}
	shareVariables(scopeList: Scope<any>[]): void {
		this.left.shareVariables(scopeList);
		this.right.shareVariables(scopeList);
		(this.arguments
			.filter(param => typeof param !== 'string') as ExpressionNode[])
			.forEach(param => param.shareVariables(scopeList))
	}
	set(stack: Stack, value: any) {
		throw new Error(`PipelineNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		const paramValue = this.left.get(stack);
		const parameters: any[] = [];
		let indexed = false;
		for (const arg of this.arguments) {
			if (arg === '?') {
				parameters.push(paramValue);
				indexed = true;
			} else if (arg === '...?') {
				parameters.push(...paramValue);
				indexed = true;
			} else {
				if (arg instanceof SpreadElement) {
					const paramScope = stack.pushBlockScopeFor(parameters);
					arg.get(stack);
					stack.clearTo(paramScope);
				} else {
					parameters.push(arg.get(stack));
				}
			}
		}
		if (!indexed) {
			parameters.unshift(paramValue);
		}
		const funCallBack = this.right.get(stack) as Function;
		if (this.right instanceof MemberExpression) {
			const thisArg = this.right.getObject().get(stack);
			return funCallBack.apply(thisArg, parameters);
		}
		return funCallBack(...parameters);
	}
	events(): DependencyVariables {
		return this.right.events()
			.concat(this.left.events())
			.concat(
				(this.arguments.filter(arg => (arg !== '?' && arg !== '...?')) as ExpressionNode[]).flatMap(param => param.events!())
			);
	}
	toString() {
		return `${this.left.toString()} |> ${this.right.toString()}${this.arguments.flatMap(arg => `:${arg.toString()}`).join('')}`;
	}
	toJson(): object {
		return {
			left: this.left.toJSON(),
			right: this.right.toJSON(),
			arguments: this.arguments.map(arg => typeof arg === 'string' ? arg : arg.toJSON())
		};
	}
}
