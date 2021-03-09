import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { ScopedStack } from '../scope.js';
import { Deserializer } from '../deserialize/deserialize.js';

/**
 * pipeline ('|>') operator support syntax:
 * param |> func:arg1:arg2:arg3
 * param |> func:arg1:?:arg3
 * 
 * param |> func(arg1, arg2, arg3)
 * param |> func(arg1, ?, arg3)
 */
@Deserializer('pipeline')
export class PipelineNode extends AbstractExpressionNode {
	static fromJSON(node: PipelineNode, deserializer: NodeDeserializer): PipelineNode {
		return new PipelineNode(
			deserializer(node.param),
			deserializer(node.func),
			node.args?.map(deserializer)
		);
	}
	static KEYWORDS = ['|>', ':', '?', ','];
	constructor(private param: ExpressionNode, private func: ExpressionNode, private args: ExpressionNode[] = [], private index = 0) {
		super();
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`PipelineNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		const funCallBack = this.func.get(stack) as Function;
		const thisContext = this.func.getThis?.(stack);
		if (this.index) {
			const args = this.args.splice(this.index, 0, this.param);
			return funCallBack.call(thisContext, ...args.map(arg => arg.get(stack)));
		}
		return funCallBack.call(thisContext, this.param.get(stack), ...this.args.map(arg => arg.get(stack)));
	}
	entry(): string[] {
		return [...this.func.entry(), ...this.param.entry(), ...this.args.flatMap(arg => arg.entry())];
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
			args: this.args?.map(arg => arg.toJSON())
		};
	}
}
