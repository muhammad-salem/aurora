import type { NodeDeserializer, ExpressionNode, CanFindScope } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('ChainExpression')
export class ChainExpression extends AbstractExpressionNode implements CanFindScope {
	static fromJSON(node: ChainExpression, deserializer: NodeDeserializer): ChainExpression {
		return new ChainExpression(deserializer(node.expression));
	}
	constructor(private expression: ExpressionNode) {
		super();
	}
	getExpression() {
		return this.expression;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack, value: any) {
		throw new Error(`ChainExpression.#set() has no implementation.`)
	}
	get(stack: Stack, thisContext?: any) {
		return this.expression.get(stack, thisContext);
	}
	findScope<T extends object>(stack: Stack): Scope<T>;
	findScope<T extends object>(stack: Stack, scope: Scope<any>): Scope<T>;
	findScope<T extends object>(stack: Stack, objectScope?: Scope<any>): Scope<T> | undefined {
		return (this.expression as ExpressionNode & CanFindScope).findScope(stack, objectScope);
	}
	events(parent?: string): string[] {
		return this.expression.events();
	}
	toString() {
		return this.expression.toString();
	}
	toJson(): object {
		return {
			expression: this.expression.toJSON(),
		};
	}
}
