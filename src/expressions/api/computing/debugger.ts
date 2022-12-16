import type { ExpressionNode, ExpressionEventPath } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('DebuggerStatement')
export class DebuggerStatement extends AbstractExpressionNode {
	static fromJSON(node: DebuggerStatement): DebuggerStatement {
		return new DebuggerStatement(node.loc);
	}
	set(stack: Stack, value: any) {
		throw new Error(`DebuggerStatement#set() has no implementation.`);
	}
	get(stack: Stack) {
		debugger;
	}
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	toString(): string {
		return 'debugger';
	}
	toJson(): object {
		return {};
	}
}
