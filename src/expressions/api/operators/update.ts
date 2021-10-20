import type { NodeDeserializer, ExpressionNode, ExpressionEventPath } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

export type UpdateOperator = '++' | '--';

@Deserializer('UpdateExpression')
export class UpdateExpression extends AbstractExpressionNode {
	static fromJSON(node: UpdateExpression, deserializer: NodeDeserializer): UpdateExpression {
		return new UpdateExpression(node.operator, deserializer(node.argument), node.prefix);
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
	shareVariables(scopeList: Scope<any>[]): void {
		this.argument.shareVariables(scopeList);
	}
	set(stack: Stack, value: any) {
		this.argument.set(stack, value);
	}
	get(stack: Stack) {
		const num = { value: this.argument.get(stack) as number };
		const returnValue = this.prefix
			? UpdateExpression.PrefixEvaluations[this.operator](num)
			: UpdateExpression.PostfixEvaluations[this.operator](num);
		this.set(stack, num.value);
		return returnValue;
	}
	dependency(): ExpressionNode[] {
		return [this];
	}
	dependencyPath(): ExpressionEventPath[] {
		return this.argument.dependencyPath();
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
