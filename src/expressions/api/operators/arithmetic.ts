import type { EvaluateNode, EvaluateType } from './types.js';
import type { NodeDeserializer, ExpressionNode, NodeExpressionClass, NodeJsonType } from '../expression.js';
import { AbstractExpressionNode, InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { StackProvider } from '../scope.js';

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
		'%%': (evalNode: EvaluateNode) => { return ((evalNode.left % evalNode.right) + evalNode.right) % evalNode.right; },

		'+': (evalNode: EvaluateNode) => { return evalNode.left + evalNode.right; },
		'-': (evalNode: EvaluateNode) => { return evalNode.left - evalNode.right; },

		'>?': (evalNode: EvaluateNode) => { return evalNode.left > evalNode.right ? evalNode.left : evalNode.right; },
		'<?': (evalNode: EvaluateNode) => { return evalNode.left > evalNode.right ? evalNode.right : evalNode.left; },
	};
	static KEYWORDS = ['**', '*', '/', '%', '+', '-', '>?', '<?'];
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

export abstract class IncrementDecrementNode extends AbstractExpressionNode {
	constructor(protected op: '++' | '--', protected node: ExpressionNode) {
		super();
	}
	abstract evaluate(num: { value: number }): number;
	abstract toString(): string;
	getOperator() {
		return this.op;
	}
	getNode() {
		return this.node;
	}
	set(stack: StackProvider, value: any) {
		this.node.set(stack, value);
	}
	get(stack: StackProvider) {
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
	toJson(): object {
		return {
			op: this.op,
			node: this.node.toJSON()
		};
	}

}

@Deserializer('postfix')
export class PostfixNode extends IncrementDecrementNode {
	static Evaluations: { [key: string]: (num: { value: number }) => number } = {
		'++': num => { return num.value++; },
		'--': num => { return num.value--; }
	};
	static fromJSON(node: PostfixNode, deserializer: NodeDeserializer): PostfixNode {
		return new PostfixNode(node.op, deserializer(node.node));
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
	static fromJSON(node: PrefixNode, deserializer: NodeDeserializer): PrefixNode {
		return new PrefixNode(node.op, deserializer(node.node));
	}
	evaluate(num: { value: number }): number {
		return PrefixNode.Evaluations[this.op](num);
	}
	toString() {
		return `${this.op}${this.node.toString()}`;
	}
}
