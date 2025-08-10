import {
	AccessorProperty, ClassBody, ClassDeclaration, ClassExpression,
	MetaProperty, MethodDefinition, MethodDefinitionKind, PrivateIdentifier,
	PropertyDefinition, StaticBlock, Super
} from '../api/class/class.js';
import { Decorator } from '../api/class/decorator.js';
import { CallExpression } from '../api/computing/call.js';
import { DebuggerStatement } from '../api/computing/debugger.js';
import { NewExpression } from '../api/computing/new.js';
import { RestElement } from '../api/computing/rest.js';
import { ReturnStatement } from '../api/computing/return.js';
import { SpreadElement } from '../api/computing/spread.js';
import {
	CatchClauseNode, ThrowStatement, TryCatchNode
} from '../api/computing/throw.js';
import { YieldExpression } from '../api/computing/yield.js';
import { ArrayExpression, ArrayPattern } from '../api/definition/array.js';
import { BindExpression } from '../api/definition/bind.js';
import {
	ArrowFunctionExpression, AssignmentPattern, FunctionDeclaration, FunctionExpression
} from '../api/definition/function.js';
import { MemberExpression } from '../api/definition/member.js';
import {
	ObjectExpression, ObjectPattern, Property
} from '../api/definition/object.js';
import { ExpressionStatement } from '../api/definition/statement.js';
import {
	Identifier, Literal, TaggedTemplateExpression, TemplateLiteral, ThisExpression
} from '../api/definition/values.js';
import {
	DeclarationExpression, ExpressionNode, SourceLocation
} from '../api/expression.js';
import { ImportAttribute } from '../api/module/common.js';
import {
	ExportAllDeclaration, ExportDefaultDeclaration,
	ExportNamedDeclaration, ExportSpecifier
} from '../api/module/export.js';
import {
	ImportDeclaration, ImportDefaultSpecifier, ImportExpression,
	ImportNamespaceSpecifier, ImportSpecifier
} from '../api/module/import.js';
import {
	AssignmentExpression, AssignmentOperator
} from '../api/operators/assignment.js';
import { AwaitExpression } from '../api/operators/await.js';
import { BinaryExpression, BinaryOperator } from '../api/operators/binary.js';
import { ChainExpression } from '../api/operators/chaining.js';
import { SequenceExpression } from '../api/operators/comma.js';
import { GroupingExpression } from '../api/operators/grouping.js';
import { LogicalExpression, LogicalOperator } from '../api/operators/logical.js';
import { PipelineExpression } from '../api/operators/pipeline.js';
import { ConditionalExpression } from '../api/operators/ternary.js';
import { UnaryExpression, UnaryOperator } from '../api/operators/unary.js';
import { UpdateExpression, UpdateOperator } from '../api/operators/update.js';
import { Program, ProgramSourceType } from '../api/program.js';
import { BlockStatement } from '../api/statement/control/block.js';
import { EmptyStatement } from '../api/statement/control/empty.js';
import { IfStatement } from '../api/statement/control/if.js';
import {
	DefaultExpression, SwitchCase, SwitchStatement
} from '../api/statement/control/switch.js';
import {
	BreakStatement, ContinueStatement, LabeledStatement
} from '../api/statement/control/terminate.js';
import { WithStatement } from '../api/statement/control/with.js';
import {
	VariableDeclarationNode, VariableDeclarator
} from '../api/statement/declarations/declares.js';
import {
	ForAwaitOfNode, ForDeclaration, ForInNode, ForNode, ForOfNode
} from '../api/statement/iterations/for.js';
import { DoWhileNode, WhileNode } from '../api/statement/iterations/while.js';
import type { NodeFactory, SourcePositionFactory } from './node.js';


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
	createFunctionDeclaration(formals: DeclarationExpression[], bodyBlock: BlockStatement, isAsync: boolean, isGenerator: boolean, name: Identifier, range?: [number, number]): FunctionDeclaration {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new FunctionDeclaration(formals, bodyBlock, isAsync, isGenerator, name, range, loc);
	}
	createFunctionExpression(formals: DeclarationExpression[], bodyBlock: BlockStatement, isAsync: boolean, isGenerator: boolean, range?: [number, number]): FunctionExpression {
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
	createVariableDeclaration(id: DeclarationExpression, init?: ExpressionNode, range?: [number, number]): VariableDeclarator {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new VariableDeclarator(id, init, range, loc);
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
	createAssignmentPattern(left: DeclarationExpression, right: ExpressionNode, range?: [number, number]): AssignmentPattern {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new AssignmentPattern(left, right, range, loc);
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
	createObjectLiteralExpression(properties: Property[], range?: [number, number]): ObjectExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ObjectExpression(properties, range, loc);
	}
	createArrayBindingPattern(elements: (DeclarationExpression | null)[], range?: [number, number]): ArrayPattern {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ArrayPattern(elements, range, loc);
	}
	createArrayLiteralExpression(elements: (ExpressionNode | SpreadElement | null)[], range?: [number, number]): ArrayExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ArrayExpression(elements, range, loc);
	}
	createAssignment(operator: AssignmentOperator, left: ExpressionNode, right: ExpressionNode, range?: [number, number]): AssignmentExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new AssignmentExpression(operator, left, right, range, loc);
	}
	createRestElement(argument: DeclarationExpression, range?: [number, number]): RestElement {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new RestElement(argument, range, loc);
	}
	createArrowFunction(params: DeclarationExpression[], body: ExpressionNode | ExpressionNode[], expression: boolean, async: boolean, range?: [number, number]): ArrowFunctionExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ArrowFunctionExpression(params, body, expression, async, range, loc);
	}
	createPropertyDeclaration(key: ExpressionNode, value: DeclarationExpression | ExpressionNode, kind: 'init' | 'get' | 'set', method: boolean, shorthand: boolean, computed: boolean, range?: [number, number]): Property {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new Property(key, value, kind, method, shorthand, computed, range, loc);
	}
	createIdentifier(name: string, range?: [number, number]): Identifier {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new Identifier(name, range, loc);
	}
	createPropertyAssignment(object: ExpressionNode, property: ExpressionNode, computed: boolean, optional?: boolean, range?: [number, number]): MemberExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new MemberExpression(object, property, computed, optional, range, loc);
	}
	createPipelineExpression(left: ExpressionNode, right: ExpressionNode, params?: (ExpressionNode | '?' | '...?')[], range?: [number, number]): PipelineExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new PipelineExpression(left, right, params, range, loc);
	}
	createCallExpression(callee: ExpressionNode, params: ExpressionNode[], optional?: boolean, range?: [number, number]): CallExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new CallExpression(callee, params, optional, range, loc);
	}
	createBindExpression(object: ExpressionNode, property: ExpressionNode, computed: boolean, optional?: boolean, range?: [number, number]): BindExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new BindExpression(object, property, computed, optional, range, loc);
	}
	createChainExpression(expression: ExpressionNode, range?: [number, number]): ChainExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ChainExpression(expression, range, loc);
	}
	createLogicalExpression(operator: LogicalOperator, left: ExpressionNode, right: ExpressionNode, range?: [number, number],): LogicalExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new LogicalExpression(operator, left, right, range, loc);
	}
	createConditionalExpression(test: ExpressionNode, alternate: ExpressionNode, consequent: ExpressionNode, range?: [number, number]): ConditionalExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ConditionalExpression(test, alternate, consequent, range, loc);
	}
	createYieldExpression(delegate: boolean, argument?: ExpressionNode, range?: [number, number]): YieldExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new YieldExpression(delegate, argument, range, loc);
	}
	createMetaProperty(meta: Identifier, property: Identifier, range?: [number, number]): MetaProperty {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new MetaProperty(meta, property, range, loc);
	}
	createProgram(sourceType: ProgramSourceType, body: ExpressionNode[], range?: [number, number]): Program {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new Program(sourceType, body, range, loc);
	}
	createClassExpression(body: ClassBody, decorators: Decorator[], id?: Identifier, superClass?: ExpressionNode, range?: [number, number]): ClassExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ClassExpression(body, decorators, id, superClass, range, loc);
	}
	createClassStaticBlockDeclaration(body: ExpressionNode[], range?: [number, number]): StaticBlock {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new StaticBlock(body, range, loc);
	}
	createMethodSignature(kind: MethodDefinitionKind, key: ExpressionNode | PrivateIdentifier, value: FunctionExpression, decorators: Decorator[], computed: boolean, isStatic: boolean, range?: [number, number]): MethodDefinition {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new MethodDefinition(kind, key, value, decorators, computed, isStatic, range, loc);
	}
	createPropertySignature(key: ExpressionNode | PrivateIdentifier, decorators: Decorator[], computed: boolean, isStatic: boolean, value?: ExpressionNode, range?: [number, number]): PropertyDefinition {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new PropertyDefinition(key, decorators, computed, isStatic, value, range, loc);
	}
	createClassBody(body: (MethodDefinition | PropertyDefinition | AccessorProperty | StaticBlock)[], range?: [number, number]): ClassBody {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ClassBody(body, range, loc);
	}
	createNamespaceExportDeclaration(specifiers: ExportSpecifier[], declaration?: DeclarationExpression, source?: Literal<string>, attributes?: ImportAttribute[], range?: [number, number]): ExportNamedDeclaration {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ExportNamedDeclaration(specifiers, declaration, source, attributes, range, loc);
	}
	createExportSpecifier(local: Identifier, exported: Identifier, range?: [number, number]): ExportSpecifier {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ExportSpecifier(local, exported, range, loc);
	}
	createImportSpecifier(local: Identifier, imported: Identifier, range?: [number, number]): ImportSpecifier {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ImportSpecifier(local, imported, range, loc);
	}
	createImportDeclaration(source: Literal<string>, specifiers?: (ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier)[], attributes?: ImportAttribute[], range?: [number, number]): ImportDeclaration {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ImportDeclaration(source, specifiers, attributes, range, loc);
	}
	createImportNamespaceSpecifier(local: Identifier, range?: [number, number]): ImportNamespaceSpecifier {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ImportNamespaceSpecifier(local, range, loc);
	}
	createImportDefaultSpecifier(local: Identifier, range?: [number, number]): ImportDefaultSpecifier {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ImportDefaultSpecifier(local, range, loc);
	}
	createImportExpression(source: Literal<string>, attributes?: ExpressionNode, range?: [number, number]): ImportExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ImportExpression(source, attributes, range, loc);
	}
	createImportWithEntry(key: Identifier | Literal<string>, value: Literal<string>, range?: [number, number]): ImportAttribute {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ImportAttribute(key, value, range, loc);
	}
	createExportDefault(declaration: FunctionDeclaration | ClassDeclaration | ExpressionNode, range?: [number, number],): ExportDefaultDeclaration {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ExportDefaultDeclaration(declaration, range, loc);
	}
	createExportAllDeclaration(source: Literal<string>, exported?: Identifier, attributes?: ImportAttribute[], range?: [number, number]): ExportAllDeclaration {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new ExportAllDeclaration(source, exported, attributes, range, loc);
	}
	createInfixExpression(op: AssignmentOperator | LogicalOperator | BinaryOperator, left: ExpressionNode, right: ExpressionNode, range?: [number, number]): AssignmentExpression | LogicalExpression | BinaryExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		switch (op) {
			case '=':
			case '+=':
			case '-=':
			case '**=':
			case '/=':
			case '%=':
			case '<<=':
			case '>>=':
			case '>>>=':
			case '&=':
			case '^=':
			case '|=':
			case '&&=':
			case '||=':
			case '??=':
				return new AssignmentExpression(op, left, right, range, loc);
			case '&&':
			case '||':
			case '??':
				return new LogicalExpression(op, left, right, range, loc);
			case '**':
			case '*':
			case '/':
			case '%':
			case '+':
			case '-':
			case '<':
			case '<=':
			case '>':
			case '>=':
			case 'in':
			case 'instanceof':
			case '==':
			case '!=':
			case '===':
			case '!==':
			case '<<':
			case '>>':
			case '>>>':
			case '&':
			case '^':
			case '|':
			case '>?':
			case '<?':
			case '<=>':
				return new BinaryExpression(op, left, right, range, loc);
			default:
				throw new Error(`Not Supported Operator: ${op}`);
		}
	}
	createUnaryExpression(operator: UpdateOperator | UnaryOperator | 'await', expression: ExpressionNode, range?: [number, number]): UpdateExpression | UnaryExpression | AwaitExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		switch (operator) {
			case '++':
			case '--':
				return new UpdateExpression(operator, expression, true, range, loc);
			case '+':
			case '-':
			case '!':
			case '~':
			case 'typeof':
			case 'void':
			case 'delete':
				return new UnaryExpression(operator, expression, range, loc);
			case 'await':
				return new AwaitExpression(expression, range, loc);
			default:
				throw new Error(`${operator} is not prefix operator`);
		}
	}
	createUpdateExpression(operator: UpdateOperator, argument: ExpressionNode, prefix: boolean, range?: [number, number]): UpdateExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new UpdateExpression(operator, argument, prefix, range, loc);
	}
	createAwaitExpression(argument: ExpressionNode, range?: [number, number]): AwaitExpression {
		const loc = this.rangeFactory?.createSourcePosition(range);
		return new AwaitExpression(argument, range, loc);
	}
	isIdentifier(node?: ExpressionNode): node is Identifier {
		return node instanceof Identifier || node?.type === 'Identifier';
	}
	isObjectExpression(node?: ExpressionNode): node is ObjectExpression {
		return node instanceof ObjectExpression || node?.type === 'ObjectExpression';
	}
	isArrayExpression(node?: ExpressionNode): node is ArrayExpression {
		return node instanceof ArrayExpression || node?.type === 'ArrayExpression';
	}
	isObjectPattern(node?: ExpressionNode): node is ObjectPattern {
		return node instanceof ObjectPattern || node?.type === 'ObjectPattern';
	}
	isArrayPattern(node?: ExpressionNode): node is ArrayPattern {
		return node instanceof ArrayPattern || node?.type === 'ArrayPattern';
	}
	isAssignmentPattern(node?: ExpressionNode): node is AssignmentPattern {
		return node instanceof AssignmentPattern || node?.type === 'AssignmentPattern';
	}
	isPattern(node?: ExpressionNode): boolean {
		return this.isObjectPattern(node) || this.isArrayPattern(node) || this.isAssignmentPattern(node);
	}
	canBePattern(node?: ExpressionNode): node is (ObjectExpression | ArrayExpression) {
		return this.isObjectExpression(node) || this.isArrayExpression(node);
	}
	isProperty(node?: ExpressionNode): node is Property {
		return node instanceof Property || node?.type === 'Property';
	}
	isMemberExpression(node?: ExpressionNode): node is MemberExpression {
		return node instanceof MemberExpression || node?.type === 'MemberExpression';
	}
	isPropertyOrMemberExpression(node?: ExpressionNode): node is (Property | MemberExpression) {
		return this.isProperty(node) || this.isMemberExpression(node);
	}
	isEmptyStatement(node: ExpressionNode): node is EmptyStatement {
		return node instanceof EmptyStatement || node?.type === 'EmptyStatement';
	}
	isSequenceExpression(node: ExpressionNode): node is SequenceExpression {
		return node instanceof SequenceExpression || node?.type === 'SequenceExpression';
	}
	isSuper(node: ExpressionNode): node is Super {
		return node instanceof Super || node?.type === 'Super';
	}
	isAssignmentExpression(node: ExpressionNode): node is AssignmentExpression {
		return node instanceof AssignmentExpression || node?.type === 'AssignmentExpression';
	}
	isGroupingExpression(node: ExpressionNode): node is GroupingExpression {
		return node instanceof GroupingExpression || node?.type === 'GroupingExpression';
	}
	isSpreadElement(node: ExpressionNode): node is SpreadElement {
		return node instanceof SpreadElement || node?.type === 'SpreadElement';
	}

}
