import type { Stack } from '../../../scope/stack.js';
import type { ExpressionNode } from '../../expression.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';

/**
 * The break statement terminates the current loop, switch, or label statement
 * and transfers program control to the statement following the terminated statement.
 * 
 * The continue statement terminates execution of the statements in the current iteration of the current or labeled loop,
 * and continues execution of the loop with the next iteration.
 *
 */
class TerminateStatement extends AbstractExpressionNode {

	constructor(private symbol: Symbol, private label?: ExpressionNode) {
		super();
	}
	getSymbol() {
		return this.symbol;
	}
	getLabel() {
		this.label;
	}
	set(stack: Stack, value: any) {
		throw new Error(`TerminateStatement#set() has no implementation.`);
	}
	get(stack: Stack) {
		return this.symbol;
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return this.symbol.description!;
	}
	toJson(): object {
		return { symbol: this.symbol.description, label: this.label };
	}
}

@Deserializer('BreakStatement')
export class BreakStatement extends TerminateStatement {
	static readonly BreakSymbol = Symbol.for('break');
	static readonly BREAK_INSTANCE = Object.freeze(new BreakStatement(BreakStatement.BreakSymbol)) as BreakStatement;
	static fromJSON(node: BreakStatement): BreakStatement {
		return BreakStatement.BREAK_INSTANCE;
	}
}

@Deserializer('ContinueStatement')
export class ContinueStatement extends TerminateStatement {
	static readonly ContinueSymbol = Symbol.for('continue');
	static readonly CONTINUE_INSTANCE = Object.freeze(new ContinueStatement(ContinueStatement.ContinueSymbol)) as ContinueStatement;
	static fromJSON(node: ContinueStatement): ContinueStatement {
		return ContinueStatement.CONTINUE_INSTANCE;
	}
}
