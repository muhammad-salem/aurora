import type { Scope } from '../../../scope/scope.js';
import type { Stack } from '../../../scope/stack.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { DependencyVariables } from '../../expression.js';

/**
 * The empty statement is a semicolon (;) indicating that no statement will be executed,
 * even if JavaScript syntax requires one.
 * The opposite behavior, where you want multiple statements,
 * but JavaScript only allows a single one, is possible using a block statement,
 * which combines several statements into a single one.
 */
@Deserializer('EmptyStatement')
export class EmptyStatement extends AbstractExpressionNode {
	static INSTANCE = Object.freeze(new EmptyStatement()) as EmptyStatement;
	static fromJSON(node: EmptyStatement): EmptyStatement {
		return EmptyStatement.INSTANCE;
	}
	private semicolon = ';';
	constructor() {
		super();
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack, value: any) {
		throw new Error(`EmptyStatement#set() has no implementation.`);
	}
	get(stack: Stack) {
		return void 0;
	}
	events(): DependencyVariables {
		return [];
	}
	toString(): string {
		return this.semicolon;
	}
	toJson(): object {
		return {};
	}
}
