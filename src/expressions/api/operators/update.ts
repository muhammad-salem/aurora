import type { NodeDeserializer, ExpressionNode } from '../expression';
import type { StackProvider } from '../scope';
import { AbstractExpressionNode } from '../abstract';
import { Deserializer } from '../deserialize/deserialize';

export type UpdateOperator = '++' | '--';

@Deserializer('UpdateExpression')
export class UpdateExpressionNode extends AbstractExpressionNode {
	static fromJSON(node: UpdateExpressionNode, deserializer: NodeDeserializer): UpdateExpressionNode {
		return new UpdateExpressionNode(node.operator, deserializer(node.argument), node.prefix);
	}

	static PostfixEvaluations: { [key: string]: (num: { value: number }) => number } = {
		'++': num => { return num.value++; },
		'--': num => { return num.value--; }
	};

	static PrefixEvaluations: { [key: string]: (num: { value: number }) => number } = {
		'++': num => { return ++num.value; },
		'--': num => { return --num.value; }
	};

	constructor(private operator: UpdateOperator, private argument: ExpressionNode, private prefix: boolean) {
		super();
	}
	getOperator() {
		return this.operator;
	}
	getArgument() {
		return this.argument;
	}
	set(stack: StackProvider, value: any) {
		this.argument.set(stack, value);
	}
	get(stack: StackProvider) {
		const num = { value: this.argument.get(stack) as number };
		const returnValue = this.prefix
			? UpdateExpressionNode.PrefixEvaluations[this.operator](num)
			: UpdateExpressionNode.PostfixEvaluations[this.operator](num);
		this.set(stack, num.value);
		return returnValue;
	}
	entry(): string[] {
		return this.argument.entry();
	}
	event(parent?: string): string[] {
		return this.argument.event(parent);
	}
	toString() {
		if (this.prefix) {
			return `${this.operator}${this.argument.toString()}`;
		}
		return `${this.argument.toString()}${this.operator}`;
	}
	toJson(): object {
		return {
			operator: this.operator,
			argument: this.argument.toJSON(),
			prefix: this.prefix
		};
	}

}
