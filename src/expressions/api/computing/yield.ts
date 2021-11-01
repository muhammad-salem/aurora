import type { NodeDeserializer, ExpressionNode, ExpressionEventPath } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode, YieldDelegateValue, YieldValue } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('YieldExpression')
export class YieldExpression extends AbstractExpressionNode {
	static fromJSON(node: YieldExpression, deserializer: NodeDeserializer): YieldExpression {
		return new YieldExpression(node.delegate, node.argument ? deserializer(node.argument) : void 0);
	}
	constructor(private delegate: boolean, private argument?: ExpressionNode) {
		super();
	}
	getArgument() {
		return this.argument;
	}
	shareVariables(scopeList: Scope<any>[]): void {
		this.argument?.shareVariables(scopeList);
	}
	set(stack: Stack, value: any) {
		throw new Error(`YieldExpression#set() has no implementation.`);
	}
	get(stack: Stack) {
		const value = this.argument?.get(stack);
		if (this.delegate) {
			return new YieldDelegateValue(value);
		}
		return new YieldValue(value);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.argument?.dependency(computed) || [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.argument?.dependencyPath(computed) || [];
	}
	toString(): string {
		return `yield${this.delegate ? '*' : ''} ${this.argument?.toString() || ''}`;
	}
	toJson(): object {
		return {
			delegate: this.delegate,
			argument: this.argument?.toJSON()
		};
	}
}
