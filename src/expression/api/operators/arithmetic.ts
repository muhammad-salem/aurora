import type { EvaluateNode, EvaluateType } from './types.js';
import type { NodeDeserializer, ExpressionNode, NodeExpressionClass, NodeJsonType } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer('arithmetic')
export class ArithmeticNode extends InfixExpressionNode {

	static fromJSON(node: ArithmeticNode, deserializer: NodeDeserializer): ArithmeticNode {
		return new ArithmeticNode(
			node.op,
			deserializer(node.left),
			deserializer(node.right)
		);
	}

	static Evaluations: EvaluateType = {
		'**': (evalNode: EvaluateNode) => { return evalNode.left ** evalNode.right; },

		'*': (evalNode: EvaluateNode) => { return evalNode.left * evalNode.right; },
		'/': (evalNode: EvaluateNode) => { return evalNode.left / evalNode.right; },
		'%': (evalNode: EvaluateNode) => { return evalNode.left % evalNode.right; },

		'+': (evalNode: EvaluateNode) => { return evalNode.left + evalNode.right; },
		'-': (evalNode: EvaluateNode) => { return evalNode.left - evalNode.right; },
	};

	static KEYWORDS = ['**', '*', '/', '%', '+', '-'];

	constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
		if (!(ArithmeticNode.KEYWORDS.includes(op))) {
			throw new Error(`[${op}]: operation has no implementation yet`);
		}
		super(op, left, right);
	}

	evalNode(evalNode: EvaluateNode) {
		return ArithmeticNode.Evaluations[this.op](evalNode);
	}
}


export abstract class IncrementDecrementNode implements ExpressionNode {
	constructor(protected op: '++' | '--', protected node: ExpressionNode) { }
	abstract getClass(): NodeExpressionClass<IncrementDecrementNode>;
	abstract evaluate(num: { value: number }): number;
	abstract toString(): string;
	set(stack: ScopedStack, value: any) {
		this.node.set(stack, value);
	}
	get(stack: ScopedStack) {
		const num = { value: this.node.get(stack) as number };
		const returnValue = this.evaluate(num);
		this.set(stack, num.value);
		return returnValue;
	}
	entry(): string[] {
		return this.node.entry();
	}
	event(parent?: string): string[] {
		return this.node.event(parent);
	}
	toJSON(): NodeJsonType {
		return {
			type: this.constructor.name,
			node: {
				op: this.op,
				node: this.node.toJSON()
			}
		}
	}

}

@Deserializer('postfix')
export class PostfixNode extends IncrementDecrementNode {
	static Evaluations: { [key: string]: (num: { value: number }) => number } = {
		'++': num => { return num.value++; },
		'--': num => { return num.value--; }
	};
	static KEYWORDS = Object.keys(PostfixNode.Evaluations);
	static fromJSON(node: PostfixNode, deserializer: NodeDeserializer): PostfixNode {
		return new PostfixNode(node.op, deserializer(node.node));
	}
	getClass(): NodeExpressionClass<PostfixNode> {
		return PostfixNode;
	}
	evaluate(num: { value: number }): number {
		return PostfixNode.Evaluations[this.op](num);
	}
	toString() {
		return `${this.node.toString()}${this.op}`;
	}
}

@Deserializer('prefix')
export class PrefixNode extends IncrementDecrementNode {
	static Evaluations: { [key: string]: (num: { value: number }) => number } = {
		'++': num => { return ++num.value; },
		'--': num => { return --num.value; }
	};
	static KEYWORDS = Object.keys(PrefixNode.Evaluations);
	static fromJSON(node: PrefixNode, deserializer: NodeDeserializer): PrefixNode {
		return new PrefixNode(node.op, deserializer(node.node));
	}
	getClass(): NodeExpressionClass<PrefixNode> {
		return PrefixNode;
	}
	evaluate(num: { value: number }): number {
		return PrefixNode.Evaluations[this.op](num);
	}
	toString() {
		return `${this.op}${this.node.toString()}`;
	}
}
