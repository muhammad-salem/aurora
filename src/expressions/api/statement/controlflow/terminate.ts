import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { ExportNode } from '../../module/export.js';
import { Stack } from '../../scope.js';

/**
 * The break statement terminates the current loop, switch, or label statement
 * and transfers program control to the statement following the terminated statement.
 * 
 * The continue statement terminates execution of the statements in the current iteration of the current or labeled loop,
 * and continues execution of the loop with the next iteration.
 *
 */
@Deserializer('TerminateStatement')
export class TerminateNode extends AbstractExpressionNode {
	static readonly BreakSymbol = Symbol.for('break');
	static readonly ContinueSymbol = Symbol.for('continue');
	static readonly BREAK_INSTANCE = Object.freeze(new TerminateNode(TerminateNode.BreakSymbol)) as TerminateNode;
	static readonly CONTINUE_INSTANCE = Object.freeze(new TerminateNode(TerminateNode.ContinueSymbol)) as TerminateNode;
	static fromJSON(node: TerminateNode): TerminateNode {
		return String(node.symbol) === 'break' ? TerminateNode.BREAK_INSTANCE : TerminateNode.CONTINUE_INSTANCE;
	}
	constructor(private symbol: Symbol, private label?: ExportNode) {
		super();
	}
	getSymbol() {
		return this.symbol;
	}
	getLabel() {
		this.label;
	}
	set(stack: Stack, value: any) {
		throw new Error(`TerminateNode#set() has no implementation.`);
	}
	get(stack: Stack) {
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
		return { symbol: this.symbol.description, label: this.label };
	}
}

@Deserializer('BreakStatement')
export class BreakNode extends TerminateNode {

}

@Deserializer('ContinueStatement')
export class ContinueNode extends TerminateNode {

}
