import type { ExpressionNode, SourceLocation } from '../api/expression.js';
import { ClassBody, ClassDeclaration, Super } from '../api/class/class.js';
import { DebuggerStatement } from '../api/computing/debugger.js';
import { Identifier, Literal, TaggedTemplateExpression, TemplateLiteral, ThisExpression } from '../api/definition/values.js';
import { UnaryExpression } from '../api/operators/unary.js';
import { EmptyStatement } from '../api/statement/control/empty.js';
import { BlockStatement } from '../api/statement/control/block.js';
import { CatchClauseNode, ThrowStatement, TryCatchNode } from '../api/computing/throw.js';
import { IfStatement } from '../api/statement/control/if.js';
import { DoWhileNode, WhileNode } from '../api/statement/iterations/while.js';
import { Decorator } from '../api/class/decorator.js';
import { ArrowFunctionExpression, FunctionDeclaration, FunctionExpression, Param } from '../api/definition/function.js';
import { DefaultExpression, SwitchCase, SwitchStatement } from '../api/statement/control/switch.js';
import { WithStatement } from '../api/statement/control/with.js';
import { ForAwaitOfNode, ForDeclaration, ForInNode, ForNode, ForOfNode } from '../api/statement/iterations/for.js';
import { VariableDeclarationNode, VariableDeclarator } from '../api/statement/declarations/declares.js';
import { BreakStatement, ContinueStatement, LabeledStatement } from '../api/statement/control/terminate.js';
import { ReturnStatement } from '../api/computing/return.js';
import { DeclarationExpression } from '../api/expression.js';
import { SpreadElement } from '../api/computing/spread.js';
import { SequenceExpression } from '../api/operators/comma.js';
import { NewExpression } from '../api/computing/new.js';
import { ObjectPattern, Property } from '../api/definition/object.js';
import { RestElement } from '../api/computing/rest.js';
import { ArrayExpression, ArrayPattern } from '../api/definition/array.js';
import { AssignmentExpression, AssignmentOperator } from '../api/operators/assignment.js';


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
	createWithStatement(object: ExpressionNode, body: ExpressionNode, range?: [number, number]): WithStatement;
	createForStatement(body: ExpressionNode, initializer: ExpressionNode, cond: ExpressionNode, next: ExpressionNode, range?: [number, number]): ForNode;
	createForOfStatement(initializer: ForDeclaration, enumerable: ExpressionNode, body: ExpressionNode, range?: [number, number]): ForOfNode;
	createForAwaitOfStatement(left: ForDeclaration, right: ExpressionNode, body: ExpressionNode, range?: [number, number]): ForAwaitOfNode;
	createForInStatement(initializer: ForDeclaration, enumerable: ExpressionNode, body: ExpressionNode, range?: [number, number]): ForInNode;
	createVariableStatement(variables: VariableDeclarator[], kind: 'let' | 'var' | 'const', range?: [number, number]): VariableDeclarationNode;
	createContinueStatement(label?: Identifier, range?: [number, number]): ContinueStatement;
	createBreakStatement(label?: Identifier, range?: [number, number]): BreakStatement;
	createReturnStatement(argument?: ExpressionNode, range?: [number, number]): ReturnStatement;
	createLabeledStatement(expression: Identifier, result: ExpressionNode, range?: [number, number]): LabeledStatement;
	createParameterDeclaration(identifier: DeclarationExpression, defaultValue?: ExpressionNode, range?: [number, number]): Param;
	createSpreadElement(argument: ExpressionNode, range?: [number, number]): SpreadElement;
	createCommaListExpression(expressions: ExpressionNode[], range?: [number, number]): SequenceExpression;
	createTemplateExpression(quasis: string[], expressions: ExpressionNode[], range?: [number, number]): TemplateLiteral;
	createTaggedTemplateExpression(tag: ExpressionNode, quasis: string[], expressions: ExpressionNode[], range?: [number, number]): TaggedTemplateExpression;
	createNewExpression(className: ExpressionNode, parameters?: ExpressionNode[], range?: [number, number]): NewExpression;
	createObjectBindingPattern(properties: (Property | RestElement)[], range?: [number, number]): ObjectPattern;
	createArrayBindingPattern(elements: (DeclarationExpression | null)[], range?: [number, number]): ArrayPattern;
	createArrayLiteralExpression(elements: (ExpressionNode | SpreadElement | null)[], range?: [number, number]): ArrayExpression;
	createAssignment(operator: AssignmentOperator, left: ExpressionNode, right: ExpressionNode, range?: [number, number]): AssignmentExpression;
	createRestElement(argument: DeclarationExpression, range?: [number, number]): RestElement;
	createArrowFunction(params: ExpressionNode[], body: ExpressionNode | ExpressionNode[], expression: boolean, async: boolean, range?: [number, number]): ArrowFunctionExpression;

}
