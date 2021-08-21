import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { StackProvider } from '../scope.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';
import { MemberExpression } from '../definition/member.js';

export type UnaryOperator = '-' | '+' | '~' | '!' | 'void' | 'delete' | 'typeof';
@Deserializer('UnaryExpression')
export class UnaryNode extends AbstractExpressionNode {
	static fromJSON(node: UnaryNode, deserializer: NodeDeserializer): UnaryNode {
		return new UnaryNode(node.operator, deserializer(node.argument));
	}
	static Evaluations: { [key: string]: (value: any) => any } = {
		'+': (value: string) => { return +value; },
		'-': (value: number) => { return -value; },
		'~': (value: number) => { return ~value; },
		'!': (value: any) => { return !value; },
		'void': (value: any) => { return void value; },
		'typeof': (value: any) => { return typeof value; },
	};
	constructor(private operator: UnaryOperator, private argument: ExpressionNode) {
		super();
	}
	getOperator() {
		return this.operator;
	}
	getArgument() {
		return this.argument;
	}
	set(stack: StackProvider, value: any) {
		return this.argument.set(stack, value);
	}
	get(stack: StackProvider, thisContext?: any) {
		switch (this.operator) {
			case 'delete': return this.getDelete(stack, thisContext);
			default:
				const value = this.argument.get(stack);
				return UnaryNode.Evaluations[this.operator](value);
		}
	}
	private getDelete(stack: StackProvider, thisContext?: any) {
		if (this.argument instanceof MemberExpression) {
			thisContext = thisContext || this.argument.getObject().get(stack);
			const right = this.argument.getProperty();
			if (right instanceof MemberExpression) {
				// [Symbol.asyncIterator]
				return delete thisContext[this.argument.getProperty().get(stack)];
			} else {
				// [10], ['string']
				return delete thisContext[this.argument.getProperty().toString()];
			}
		}
	}
	entry(): string[] {
		return this.argument.entry();
	}
	event(parent?: string): string[] {
		return this.argument.event(parent);
	}
	toString() {
		switch (this.operator) {
			case 'void':
			case 'delete':
			case 'typeof':
				return `${this.operator} ${this.argument.toString()}`;
			default:
				return `${this.operator}${this.argument.toString()}`;
		}
	}
	toJson(): object {
		return {
			operator: this.operator,
			argument: this.argument.toJSON(),
			prefix: true
		};
	}
}
