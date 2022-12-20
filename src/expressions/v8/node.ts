import type { ExpressionNode, SourceLocation } from '../api/expression.js';
import { ClassBody, ClassDeclaration, Super } from '../api/class/class.js';
import { DebuggerStatement } from '../api/computing/debugger.js';
import { Identifier, Literal, ThisExpression } from '../api/definition/values.js';
import { UnaryExpression } from '../api/operators/unary.js';
import { EmptyStatement } from '../api/statement/control/empty.js';
import { BlockStatement } from '../api/statement/control/block.js';
import { CatchClauseNode, ThrowStatement, TryCatchNode } from '../api/computing/throw.js';
import { IfStatement } from '../api/statement/control/if.js';
import { DoWhileNode, WhileNode } from '../api/statement/iterations/while.js';
import { Decorator } from '../api/class/decorator.js';
import { FunctionDeclaration, FunctionExpression } from '../api/definition/function.js';
import { RangeOrVoid } from './inline.js';
import { DefaultExpression, SwitchCase, SwitchStatement } from '../api/statement/control/switch.js';


export interface SourcePositionFactory {
	createSourcePosition(range?: [number, number]): SourceLocation | undefined;
}

export interface NodeFactory {
	createDebuggerStatement(range?: [number, number]): DebuggerStatement;
	createSuper(range?: [number, number]): Super;
	createThis(range?: [number, number]): ThisExpression;
	createNull(range?: [number, number]): Literal<null>;
	createTrue(range?: [number, number]): Literal<true>;
	createFalse(range?: [number, number]): Literal<false>;
	createVoidZero(argument: ExpressionNode, range?: [number, number]): UnaryExpression;
	createEmptyStatement(range?: [number, number]): EmptyStatement;
	createExpressionStatement(list: ExpressionNode[], range?: [number, number]): ExpressionNode;
	createCatchClause(block: BlockStatement, identifier?: ExpressionNode, range?: [number, number]): CatchClauseNode;
	createTryStatement(tryBlock: BlockStatement, catchBlock?: ExpressionNode, finallyBlock?: ExpressionNode, range?: [number, number]): TryCatchNode;
	createThrowStatement(exception: ExpressionNode, range?: [number, number]): ThrowStatement;
	createBlock(statements: ExpressionNode[], range?: [number, number]): BlockStatement;
	createIfStatement(condition: ExpressionNode, thenStatement: ExpressionNode, elseStatement?: ExpressionNode, range?: [number, number]): IfStatement;
	createDoStatement(condition: ExpressionNode, body: ExpressionNode, range?: [number, number]): DoWhileNode;
	createClassDeclaration(body: ClassBody, decorators: Decorator[], id: Identifier, superClass?: ExpressionNode, range?: [number, number]): ClassDeclaration;
	createFunctionDeclaration(formals: ExpressionNode[], bodyBlock: BlockStatement, isAsync: boolean, isGenerator: boolean, name: Identifier, range?: [number, number]): FunctionDeclaration;
	createFunctionExpression(formals: ExpressionNode[], bodyBlock: BlockStatement, isAsync: boolean, isGenerator: boolean, range?: [number, number]): FunctionExpression;
	createWhileStatement(condition: ExpressionNode, body: ExpressionNode, range?: [number, number]): WhileNode;
	createSwitchStatement(tag: ExpressionNode, cases: SwitchCase[], range?: [number, number]): SwitchStatement;
	createCaseBlock(test: ExpressionNode, block: BlockStatement, range?: [number, number]): SwitchCase;
	createDefaultClause(block: BlockStatement, range?: [number, number]): DefaultExpression;


}
