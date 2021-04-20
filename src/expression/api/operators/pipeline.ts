import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { ScopedStack } from '../scope.js';
import { Deserializer } from '../deserialize/deserialize.js';

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
			node.args.map(arg => arg === '?' ? arg : deserializer(arg))
		);
	}
	static KEYWORDS = ['|>', ':', '?', ','];
	constructor(private param: ExpressionNode, private func: ExpressionNode, private args: (ExpressionNode | '?')[] = []) {
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
		const paramValue = this.param.get(stack, thisContext);
		const funCallBack = this.func.get(stack) as Function;
		const argumentList = this.args.map(arg => arg === '?' ? paramValue : arg.get(stack));
		const indexed = this.args.includes('?');
		if (indexed) {
			return funCallBack.call(thisContext, ...argumentList);
		}
		return funCallBack.call(thisContext, paramValue, ...argumentList);
	}
	entry(): string[] {
		return [
			...this.func.entry(),
			...this.param.entry(),
			...(this.args.filter(arg => arg !== '?') as ExpressionNode[]).flatMap(arg => arg.entry!())
		];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString() {
		return `${this.param.toString()} |> ${this.func.toString()}${this.args.flatMap(arg => `:${arg.toString()}`).join('')}`;
	}
	toJson(): object {
		return {
			param: this.param.toJSON(),
			func: this.func.toJSON(),
			args: this.args?.map(arg => arg === '?' ? arg : arg.toJSON())
		};
	}
}
