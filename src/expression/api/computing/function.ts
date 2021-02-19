import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { ScopedStack } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { SpreadSyntaxNode } from './spread.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('function-call')
export class FunctionCallNode extends AbstractExpressionNode {

	static fromJSON(node: FunctionCallNode, deserializer: NodeDeserializer): FunctionCallNode {
		return new FunctionCallNode(deserializer(node.func), node.params.map(param => deserializer(param)));
	}

	constructor(private func: ExpressionNode, private params: ExpressionNode[]) {
		super();
	}

	set(stack: ScopedStack, value: any) {
		throw new Error(`FunctionCallNode#set() has no implementation.`);
	}

	get(stack: ScopedStack,) {
		const funCallBack = this.func.get(stack) as Function;
		const argArray: any[] = [];
		this.params.forEach(param => {
			if (param instanceof SpreadSyntaxNode) {
				const spreadObj = param.get(stack);
				if (Array.isArray(spreadObj)) {
					spreadObj.forEach(arg => argArray.push(arg));
				} else {
					/** wrong use her, it shouldn't do that */
					// args.push(spreadObj);
					throw new Error('a function support only spread array syntax');
				}
			} else {
				argArray.push(param.get(stack));
			}
		});
		const value = funCallBack.call(this.func.getThis?.(stack), ...argArray);
		return value;
	}

	entry(): string[] {
		return [...this.func.entry(), ...this.params.flatMap(param => param.entry())];
	}

	event(parent?: string): string[] {
		return [];
	}

	toString(): string {
		return `${this.func.toString()}(${this.params.map(param => param.toString()).join(', ')})`;
	}

	toJson(): object {
		return {
			func: this.func.toJSON(),
			params: this.params.map(param => param.toJSON())
		};
	}

}
