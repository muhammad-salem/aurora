import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { StackProvider } from '../../scope.js';

/**
 * The break statement terminates the current loop, switch, or label statement
 * and transfers program control to the statement following the terminated statement.
 * 
 * The continue statement terminates execution of the statements in the current iteration of the current or labeled loop,
 * and continues execution of the loop with the next iteration.
 *
 */
@Deserializer('terminate')
export class TerminateNode extends AbstractExpressionNode {
	static readonly BreakSymbol = Symbol.for('break');
	static readonly ContinueSymbol = Symbol.for('continue');
	static readonly BREAK_INSTANCE = Object.freeze(new TerminateNode(TerminateNode.BreakSymbol)) as TerminateNode;
	static readonly CONTINUE_INSTANCE = Object.freeze(new TerminateNode(TerminateNode.ContinueSymbol)) as TerminateNode;
	static fromJSON(node: TerminateNode): TerminateNode {
		return String(node.symbol) === 'break' ? TerminateNode.BREAK_INSTANCE : TerminateNode.CONTINUE_INSTANCE;
	}
	private constructor(private symbol: Symbol) {
		super();
	}
	getSymbol() {
		return this.symbol;
	}
	set(stack: StackProvider, value: any) {
		throw new Error(`TerminateNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		return this.symbol;
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return this.symbol.description!;
	}
	toJson(): object {
		return { symbol: this.symbol.description };
	}
}
