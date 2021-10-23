import type { NodeDeserializer, ExpressionNode, ExpressionEventPath } from '../../expression.js';
import type { Scope } from '../../../scope/scope.js';
import type { Stack } from '../../../scope/stack.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';

/**
 * The if statement executes a statement if a specified condition is truthy.
 * If the condition is falsy, another statement can be executed.
 * 
 */
@Deserializer('IfStatement')
export class IfStatement extends AbstractExpressionNode {
	static fromJSON(node: IfStatement, deserializer: NodeDeserializer): IfStatement {
		return new IfStatement(
			deserializer(node.test),
			deserializer(node.consequent),
			node.alternate ? deserializer(node.alternate) : void 0
		);
	}
	constructor(private test: ExpressionNode, private consequent: ExpressionNode, private alternate?: ExpressionNode) {
		super();
	}
	getTest() {
		return this.test;
	}
	getConsequent() {
		return this.consequent;
	}
	getAlternate() {
		return this.alternate;
	}
	shareVariables(scopeList: Scope<any>[]): void {
		this.test.shareVariables(scopeList);
		this.consequent.shareVariables(scopeList);
		this.alternate?.shareVariables(scopeList);
	}
	set(stack: Stack, value: any) {
		throw new Error(`IfStatement#set() has no implementation.`);
	}
	get(stack: Stack) {
		const condition = this.test.get(stack);
		if (condition) {
			const ifBlock = stack.pushBlockScope();
			const value = this.consequent.get(stack);
			stack.clearTo(ifBlock);
			return value;
		} else if (this.alternate) {
			const elseBlock = stack.pushBlockScope();
			const value = this.alternate.get(stack);
			stack.clearTo(elseBlock);
			return value;
		}
		return void 0;
	}
	dependency(): ExpressionNode[] {
		return this.test.dependency()
			.concat(
				this.consequent.dependency(),
				this.alternate?.dependency() || []
			);
	}
	dependencyPath(computed: true): ExpressionEventPath[] {
		return this.test.dependencyPath(computed).concat(
			this.consequent.dependencyPath(computed),
			this.alternate?.dependencyPath(computed) || []
		);
	}
	toString(): string {
		return `if (${this.test.toString()}) ${this.consequent.toString()}${this.alternate ? ' else ' : ''}${this.alternate ? this.alternate.toString() : ''}`;
	}
	toJson(): object {
		return {
			test: this.test.toJSON(),
			consequent: this.consequent.toJSON(),
			alternate: this.alternate?.toJSON()
		};
	}
}
