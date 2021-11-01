import type { NodeDeserializer, ExpressionNode, ExpressionEventPath } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode, AwaitPromise } from '../abstract.js';


@Deserializer('AwaitExpression')
export class AwaitExpression extends AbstractExpressionNode {
	static fromJSON(node: AwaitExpression, serializer: NodeDeserializer): AwaitExpression {
		return new AwaitExpression(serializer(node.argument));
	}
	constructor(private argument: ExpressionNode) {
		super();
	}
	getArgument() {
		return this.argument;
	}
	shareVariables(scopeList: Scope<any>[]): void {
		this.argument.shareVariables(scopeList);
	}
	set(stack: Stack, value: any) {
		throw new Error('AwaitExpression#set() has no implementation.');
	}
	get(stack: Stack, thisContext?: any) {
		const promise = this.argument.get(stack);
		return new AwaitPromise(promise);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.argument.dependency(computed);
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.argument.dependencyPath(computed);
	}
	toString() {
		return `await ${this.argument.toString()}`;
	}
	toJson(): object {
		return {
			argument: this.argument.toJSON()
		};
	}
}
