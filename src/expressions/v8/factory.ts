import type { NodeFactory, SourcePositionFactory } from './node.js';
import { ClassBody, ClassDeclaration, Super } from '../api/class/class.js';
import { DebuggerStatement } from '../api/computing/debugger.js';
import { Identifier, Literal, ThisExpression } from '../api/definition/values.js';
import { ExpressionNode, SourceLocation } from '../api/expression.js';
import { UnaryExpression } from '../api/operators/unary.js';
import { EmptyStatement } from '../api/statement/control/empty.js';
import { ExpressionStatement } from '../api/definition/statement.js';
import { BlockStatement } from '../api/statement/control/block.js';
import { CatchClauseNode, ThrowStatement, TryCatchNode } from '../api/computing/throw.js';
import { IfStatement } from '../api/statement/control/if.js';
import { DoWhileNode } from '../api/statement/iterations/while.js';
import { Decorator } from '../api/class/decorator.js';
import { RangeOrVoid } from './inline.js';


export class ExpressionNodeSourcePosition implements SourcePositionFactory {
	private newLineRegex = new RegExp('\n', 'g');

	constructor(private source: string) { }

	private getLineNumber(index: number, defaultValue: number) {
		return this.source.substring(0, index).match(this.newLineRegex)?.length ?? defaultValue;
	}

	private getColumnNumber(index: number) {
		const end = this.source.lastIndexOf('\n', index);
		if (end === -1) {
			return index;
		}
		return index - end - 1;
	}

	public createSourcePosition(range?: [number, number]): SourceLocation | undefined {
		if (!range || !this.source) {
			return;
		}
		const startLine = this.getLineNumber(range[0], 1);
		const endLine = this.getLineNumber(range[1], startLine);
		const startColumn = this.getColumnNumber(range[0]);
		const endColumn = this.getColumnNumber(range[1]);
		return {
			start: { line: startLine, column: startColumn },
			end: { line: endLine, column: endColumn },
		};
	}

}

export class ExpressionNodeFactory implements NodeFactory {

	constructor(private rangeFactory?: SourcePositionFactory) { }

	createDebuggerStatement(range?: [number, number]): DebuggerStatement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new DebuggerStatement(range, loc);
	}

	createSuper(range?: [number, number]): Super {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new Super(range, loc);
	}
	createThis(range?: [number, number]): ThisExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ThisExpression(range, loc);
	}
	createNull(range?: [number, number]): Literal<null> {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new Literal(null, undefined, undefined, undefined, range, loc);
	}
	createTrue(range?: [number, number]): Literal<true> {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new Literal(true, undefined, undefined, undefined, range, loc);
	}
	createFalse(range?: [number, number]): Literal<false> {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new Literal(false, undefined, undefined, undefined, range, loc);
	}
	createVoidZero(argument: ExpressionNode, range?: [number, number]): UnaryExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new UnaryExpression('void', argument, range, loc);
	}
	createEmptyStatement(range?: [number, number]): EmptyStatement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new EmptyStatement(range, loc);
	}
	createExpressionStatement(list: ExpressionNode[], range?: [number, number]): ExpressionNode {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ExpressionStatement(list, range, loc);
	}
	createCatchClause(block: BlockStatement, identifier?: ExpressionNode, range?: [number, number]): CatchClauseNode {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new CatchClauseNode(block, identifier, range, loc);
	}
	createTryStatement(tryBlock: BlockStatement, catchBlock?: ExpressionNode, finallyBlock?: ExpressionNode, range?: [number, number]): TryCatchNode {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new TryCatchNode(tryBlock, catchBlock, finallyBlock, range, loc);
	}
	createThrowStatement(exception: ExpressionNode, range?: [number, number]): ThrowStatement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ThrowStatement(exception, range, loc);
	}

	createBlock(statements: ExpressionNode[], range?: [number, number]): BlockStatement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new BlockStatement(statements, range, loc);
	}
	createIfStatement(condition: ExpressionNode, thenStatement: ExpressionNode, elseStatement?: ExpressionNode, range?: [number, number]): IfStatement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new IfStatement(condition, thenStatement, elseStatement, range, loc);
	}

	createDoStatement(condition: ExpressionNode, body: ExpressionNode, range?: [number, number] | undefined): DoWhileNode {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new DoWhileNode(condition, body, range, loc);
	}

	createClassDeclaration(body: ClassBody, decorators: Decorator[], id: Identifier, superClass?: ExpressionNode, range?: [number, number]): ClassDeclaration {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ClassDeclaration(body, decorators, id, superClass, range, loc);
	}

}
