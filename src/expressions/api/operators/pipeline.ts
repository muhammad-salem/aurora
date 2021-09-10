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
	set(stack: Stack, value: any) {
		throw new Error(`PipelineNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		const paramValue = this.left.get(stack);
		const funCallBack = this.right.get(stack) as Function;
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
					stack.pushBlockScopeFor(parameters);
					arg.get(stack);
					stack.popScope();
				} else {
					parameters.push(arg.get(stack));
				}
			}
		}
		if (!indexed) {
			parameters.unshift(paramValue);
		}
		return funCallBack(parameters);
	}
	events(parent?: string): string[] {
		return [
			...this.right.events(),
			...this.left.events(),
			...(this.arguments.filter(arg => (arg !== '?' && arg !== '...?')) as ExpressionNode[]).flatMap(param => param.events!())
		];
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


/**
 * pipeline (':|>') operator support syntax:
 *  param :|> func 					==>	func.call(this=param)
 *  param |> func:arg1:arg2:arg3	==>	func.call(param, arg1, arg2, arg3)
 * 
 *  param |> func(arg1, arg2) ==>	func.call(param, arg1, arg2)
 */
@Deserializer('BindPipelineExpression')
export class BindPipelineExpression extends AbstractExpressionNode {
	static fromJSON(node: BindPipelineExpression, deserializer: NodeDeserializer): BindPipelineExpression {
		return new BindPipelineExpression(
			deserializer(node.left),
			deserializer(node.right),
			node.arguments.map(arg => typeof arg === 'string' ? arg : deserializer(arg))
		);
	}
	private arguments: ExpressionNode[];
	constructor(private left: ExpressionNode, private right: ExpressionNode, params: ExpressionNode[] = []) {
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
	set(stack: Stack, value: any) {
		throw new Error(`BindPipelineExpression#set() has no implementation.`);
	}
	get(stack: Stack) {
		const paramValue = this.left.get(stack);
		const funCallBack = this.right.get(stack) as Function;
		const parameters: any[] = [];
		for (const arg of this.arguments) {
			if (arg instanceof SpreadElement) {
				stack.pushBlockScopeFor(parameters);
				arg.get(stack);
				stack.popScope();
			} else {
				parameters.push(arg.get(stack));
			}
		}
		return funCallBack.apply(paramValue, parameters);
	}
	events(parent?: string): string[] {
		return [
			...this.right.events(),
			...this.left.events(),
			...(this.arguments.flatMap(param => param.events!()))
		];
	}
	toString() {
		return `${this.left.toString()} :|> ${this.right.toString()}${this.arguments.flatMap(arg => `:${arg.toString()}`).join('')}`;
	}
	toJson(): object {
		return {
			left: this.left.toJSON(),
			right: this.right.toJSON(),
			arguments: this.arguments.map(arg => arg.toJSON())
		};
	}
}
