
import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { StackProvider } from '../../scope.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { TerminateNode } from './terminate.js';
import { IdentifierNode } from '../../definition/values.js';


@Deserializer('SwitchCase')
export class CaseExpression extends AbstractExpressionNode {
	static fromJSON(node: CaseExpression, deserializer: NodeDeserializer): CaseExpression {
		return new CaseExpression(
			deserializer(node.test),
			deserializer(node.consequent)
		);
	}
	constructor(protected test: ExpressionNode, protected consequent: ExpressionNode) {
		super();
	}
	getTest() {
		return this.test;
	}
	getConsequent() {
		return this.consequent;
	}
	set(stack: StackProvider, value: any) {
		throw new Error(`CaseExpression#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		return this.consequent.get(stack);
	}
	entry(): string[] {
		return this.test.entry();
	}
	event(parent?: string): string[] {
		return this.test.event();
	}
	toString(): string {
		return `case ${this.test.toString()}: ${this.consequent.toString()};`;
	}
	toJson(): object {
		return {
			test: this.test.toJSON(),
			consequent: this.consequent.toJSON()
		};
	}
}

@Deserializer('default')
export class DefaultExpression extends CaseExpression {
	static DEFAULT_KEYWORD = 'default';
	static DefaultNode = Object.freeze(new IdentifierNode(DefaultExpression.DEFAULT_KEYWORD)) as IdentifierNode;
	static fromJSON(node: DefaultExpression, deserializer: NodeDeserializer): DefaultExpression {
		return new DefaultExpression(deserializer(node.consequent));
	}
	constructor(block: ExpressionNode) {
		super(DefaultExpression.DefaultNode, block);
	}
	toString(): string {
		return `default: ${this.consequent.toString()};`;
	}
	toJson(): object {
		return {
			consequent: this.consequent.toJSON()
		};
	}
}

/**
 * The switch statement evaluates an expression, matching the expression's value to a case clause,
 * and executes statements associated with that case,
 * as well as statements in cases that follow the matching case.
 * 
 */
@Deserializer('switch')
export class SwitchNode extends AbstractExpressionNode {
	static fromJSON(node: SwitchNode, deserializer: NodeDeserializer): SwitchNode {
		return new SwitchNode(
			deserializer(node.discriminant),
			node.cases.map(deserializer) as CaseExpression[]
		);
	}
	constructor(private discriminant: ExpressionNode, private cases: CaseExpression[]) {
		super();
	}
	getDiscriminant() {
		return this.discriminant;
	}
	getCases() {
		return this.cases;
	}
	set(stack: StackProvider, value: any) {
		throw new Error(`SwitchNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		// need to fix statements execution and support default case
		stack = stack.newStack();
		const result = this.discriminant.get(stack);
		const values = this.cases.map(item => item.getValue().get(stack));
		let startIndex = values.findIndex(item => result === item);
		if (startIndex === -1) {
			// search for default statement
			startIndex = this.cases.findIndex(item => item instanceof DefaultExpression);
			if (startIndex === -1) {
				return;
			}
		}
		for (let index = startIndex; index < this.cases.length; index++) {
			const returnValue = this.cases[index].get(stack);
			if (returnValue === TerminateNode.BreakSymbol) {
				break;
			}
		}
		return void 0;
	}
	entry(): string[] {
		return this.discriminant.entry().concat(this.cases.flatMap(item => item.entry()));
	}
	event(parent?: string): string[] {
		return [
			...this.discriminant.event(),
			...this.cases
				.filter(c => c.getValue() !== DefaultExpression.DefaultNode)
				.flatMap(c => c.getValue().event())
		];
	}
	toString(): string {
		return `switch (${this.discriminant.toString()}) {${this.cases.map(item => item.toString())}`;
	}
	toJson(): object {
		return {
			discriminant: this.discriminant.toJSON(),
			cases: this.cases.map(item => item.toJSON())
		};
	}
}
