import type { NodeFactory, SourcePositionFactory } from './node.js';
import { ClassBody, ClassDeclaration, Super } from '../api/class/class.js';
import { DebuggerStatement } from '../api/computing/debugger.js';
import { Identifier, Literal, TaggedTemplateExpression, TemplateLiteral, ThisExpression } from '../api/definition/values.js';
import { DeclarationExpression, ExpressionNode, SourceLocation } from '../api/expression.js';
import { UnaryExpression } from '../api/operators/unary.js';
import { EmptyStatement } from '../api/statement/control/empty.js';
import { ExpressionStatement } from '../api/definition/statement.js';
import { BlockStatement } from '../api/statement/control/block.js';
import { CatchClauseNode, ThrowStatement, TryCatchNode } from '../api/computing/throw.js';
import { IfStatement } from '../api/statement/control/if.js';
import { DoWhileNode, WhileNode } from '../api/statement/iterations/while.js';
import { Decorator } from '../api/class/decorator.js';
import { ArrowFunctionExpression, FunctionDeclaration, FunctionExpression, Param } from '../api/definition/function.js';
import { WithStatement } from '../api/statement/control/with.js';
import { DefaultExpression, SwitchCase, SwitchStatement } from '../api/statement/control/switch.js';
import { ForAwaitOfNode, ForDeclaration, ForInNode, ForNode, ForOfNode } from '../api/statement/iterations/for.js';
import { VariableDeclarationNode, VariableDeclarator } from '../api/statement/declarations/declares.js';
import { BreakStatement, ContinueStatement, LabeledStatement } from '../api/statement/control/terminate.js';
import { ReturnStatement } from '../api/computing/return.js';
import { SpreadElement } from '../api/computing/spread.js';
import { SequenceExpression } from '../api/operators/comma.js';
import { NewExpression } from '../api/computing/new.js';
import { ObjectPattern, Property } from '../api/definition/object.js';
import { RestElement } from '../api/computing/rest.js';
import { ArrayPattern } from '../api/definition/array.js';
import { AssignmentExpression, AssignmentOperator } from '../api/operators/assignment.js';


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
	createFunctionDeclaration(formals: ExpressionNode[], bodyBlock: BlockStatement, isAsync: boolean, isGenerator: boolean, name: Identifier, range?: [number, number]): FunctionDeclaration {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new FunctionDeclaration(formals, bodyBlock, isAsync, isGenerator, name, range, loc);
	}
	createFunctionExpression(formals: ExpressionNode[], bodyBlock: BlockStatement, isAsync: boolean, isGenerator: boolean, range?: [number, number]): FunctionExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new FunctionExpression(formals, bodyBlock, isAsync, isGenerator, undefined, range, loc);
	}
	createWhileStatement(condition: ExpressionNode, body: ExpressionNode, range?: [number, number] | undefined): WhileNode {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new WhileNode(condition, body, range, loc);
	}
	createSwitchStatement(tag: ExpressionNode, cases: SwitchCase[], range?: [number, number] | undefined): SwitchStatement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new SwitchStatement(tag, cases, range, loc);
	}
	createCaseBlock(test: ExpressionNode, block: BlockStatement, range?: [number, number] | undefined): SwitchCase {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new SwitchCase(test, block, range, loc);
	}
	createDefaultClause(block: BlockStatement, range?: [number, number] | undefined): DefaultExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new DefaultExpression(block, range, loc);
	}
	createWithStatement(object: ExpressionNode, body: ExpressionNode, range?: [number, number]): WithStatement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new WithStatement(object, body, range, loc);
	}
	createForStatement(body: ExpressionNode, initializer: ExpressionNode, cond: ExpressionNode, next: ExpressionNode, range?: [number, number] | undefined): ForNode {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ForNode(body, initializer, cond, next, range, loc);
	}
	createForOfStatement(initializer: ForDeclaration, enumerable: ExpressionNode, body: ExpressionNode, range?: [number, number] | undefined): ForOfNode {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ForOfNode(initializer, enumerable, body, range, loc);
	}
	createForAwaitOfStatement(left: ForDeclaration, right: ExpressionNode, body: ExpressionNode, range?: [number, number] | undefined): ForAwaitOfNode {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ForAwaitOfNode(left, right, body, range, loc);
	}
	createForInStatement(initializer: ForDeclaration, enumerable: ExpressionNode, body: ExpressionNode, range?: [number, number]): ForInNode {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ForInNode(initializer, enumerable, body, range, loc);
	}
	createVariableStatement(variables: VariableDeclarator[], kind: 'let' | 'var' | 'const', range?: [number, number]): VariableDeclarationNode {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new VariableDeclarationNode(variables, kind, range, loc);
	}
	createContinueStatement(label?: Identifier, range?: [number, number]): ContinueStatement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ContinueStatement(label, range, loc);
	}
	createBreakStatement(label?: Identifier, range?: [number, number]): BreakStatement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new BreakStatement(label, range, loc);
	}
	createReturnStatement(argument?: ExpressionNode, range?: [number, number]): ReturnStatement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ReturnStatement(argument, range, loc);
	}
	createLabeledStatement(expression: Identifier, result: ExpressionNode, range?: [number, number]): LabeledStatement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new LabeledStatement(expression, result, range, loc);
	}
	createParameterDeclaration(identifier: DeclarationExpression, defaultValue?: ExpressionNode, range?: [number, number]): Param {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new Param(identifier, defaultValue, range, loc);
	}
	createSpreadElement(argument: ExpressionNode, range?: [number, number]): SpreadElement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new SpreadElement(argument, range, loc);
	}
	createCommaListExpression(expressions: ExpressionNode[], range?: [number, number] | undefined): SequenceExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new SequenceExpression(expressions, range, loc);
	}
	createTemplateExpression(quasis: string[], expressions: ExpressionNode[], range?: [number, number]): TemplateLiteral {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new TemplateLiteral(quasis, expressions, range, loc);
	}
	createTaggedTemplateExpression(tag: ExpressionNode, quasis: string[], expressions: ExpressionNode[], range?: [number, number]): TaggedTemplateExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new TaggedTemplateExpression(tag, quasis, expressions, range, loc);
	}
	createNewExpression(className: ExpressionNode, parameters?: ExpressionNode[], range?: [number, number]): NewExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new NewExpression(className, parameters, range, loc);
	}
	createObjectBindingPattern(properties: (Property | RestElement)[], range?: [number, number] | undefined): ObjectPattern {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ObjectPattern(properties, range, loc);
	}
	createArrayBindingPattern(elements: (DeclarationExpression | null)[], range?: [number, number]): ArrayPattern {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ArrayPattern(elements, range, loc);
	}
	createAssignment(operator: AssignmentOperator, left: ExpressionNode, right: ExpressionNode, range?: [number, number]): AssignmentExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new AssignmentExpression(operator, left, right, range, loc);
	}
	createRestElement(argument: DeclarationExpression, range?: [number, number]): RestElement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new RestElement(argument, range, loc);
	}
	createArrowFunction(params: ExpressionNode[], body: ExpressionNode | ExpressionNode[], expression: boolean, async: boolean, range?: [number, number]): ArrowFunctionExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ArrowFunctionExpression(params, body, expression, async, range, loc);
	}


}
