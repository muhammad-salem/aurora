import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { ScopedStack } from '../scope.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { SpreadNode } from '../computing/spread.js';

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
@Deserializer('pipeline')
export class PipelineNode extends AbstractExpressionNode {
	static fromJSON(node: PipelineNode, deserializer: NodeDeserializer): PipelineNode {
		return new PipelineNode(
			deserializer(node.param),
			deserializer(node.func),
			node.args.map(arg => typeof arg === 'string' ? arg : deserializer(arg))
		);
	}
	constructor(private param: ExpressionNode, private func: ExpressionNode, private args: (ExpressionNode | '?' | '...?')[] = []) {
		super();
	}
	getParam() {
		return this.param;
	}
	getFunc() {
		return this.func;
	}
	getArgs() {
		return this.args;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`PipelineNode#set() has no implementation.`);
	}
	get(stack: ScopedStack, thisContext?: any) {
		const paramValue = this.param.get(stack);
		const funCallBack = this.func.get(stack, thisContext) as Function;
		const parameters: any[] = [];
		const parametersStack = stack.emptyScopeFor(parameters);
		let indexed = false;
		for (const arg of this.args) {
			if (arg === '?') {
				parameters.push(paramValue);
				indexed = true;
			} else if (arg === '...?') {
				parameters.push(...paramValue);
				indexed = true;
			} else {
				if (arg instanceof SpreadNode) {
					arg.get(parametersStack);
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
	entry(): string[] {
		return [
			...this.func.entry(),
			...this.param.entry(),
			...(this.args.filter(arg => (arg !== '?' && arg !== '...?')) as ExpressionNode[]).flatMap(arg => arg.entry!())
		];
	}
	event(parent?: string): string[] {
		return [
			...this.func.event(),
			...this.param.event(),
			...(this.args.filter(arg => (arg !== '?' && arg !== '...?')) as ExpressionNode[]).flatMap(arg => arg.event!())
		];
	}
	toString() {
		return `${this.param.toString()} |> ${this.func.toString()}${this.args.flatMap(arg => `:${arg.toString()}`).join('')}`;
	}
	toJson(): object {
		return {
			param: this.param.toJSON(),
			func: this.func.toJSON(),
			args: this.args?.map(arg => typeof arg === 'string' ? arg : arg.toJSON())
		};
	}
}
