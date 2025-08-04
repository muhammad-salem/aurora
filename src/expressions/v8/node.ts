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
import {
	Identifier, Literal, TaggedTemplateExpression, TemplateLiteral, ThisExpression
} from '../api/definition/values.js';
import type { ExpressionNode, SourceLocation } from '../api/expression.js';
import { DeclarationExpression } from '../api/expression.js';
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
	createFunctionDeclaration(formals: DeclarationExpression[], bodyBlock: BlockStatement, isAsync: boolean, isGenerator: boolean, name: Identifier, range?: [number, number]): FunctionDeclaration;
	createFunctionExpression(formals: DeclarationExpression[], bodyBlock: BlockStatement, isAsync: boolean, isGenerator: boolean, range?: [number, number]): FunctionExpression;
	createWhileStatement(condition: ExpressionNode, body: ExpressionNode, range?: [number, number]): WhileNode;
	createSwitchStatement(tag: ExpressionNode, cases: SwitchCase[], range?: [number, number]): SwitchStatement;
	createCaseBlock(test: ExpressionNode, block: BlockStatement, range?: [number, number]): SwitchCase;
	createDefaultClause(block: BlockStatement, range?: [number, number]): DefaultExpression;
	createWithStatement(object: ExpressionNode, body: ExpressionNode, range?: [number, number]): WithStatement;
	createForStatement(body: ExpressionNode, initializer: ExpressionNode, cond: ExpressionNode, next: ExpressionNode, range?: [number, number]): ForNode;
	createForOfStatement(initializer: ForDeclaration, enumerable: ExpressionNode, body: ExpressionNode, range?: [number, number]): ForOfNode;
	createForAwaitOfStatement(left: ForDeclaration, right: ExpressionNode, body: ExpressionNode, range?: [number, number]): ForAwaitOfNode;
	createForInStatement(initializer: ForDeclaration, enumerable: ExpressionNode, body: ExpressionNode, range?: [number, number]): ForInNode;
	createVariableDeclaration(id: DeclarationExpression, init?: ExpressionNode, range?: [number, number]): VariableDeclarator;
	createVariableStatement(variables: VariableDeclarator[], kind: 'let' | 'var' | 'const', range?: [number, number]): VariableDeclarationNode;
	createContinueStatement(label?: Identifier, range?: [number, number]): ContinueStatement;
	createBreakStatement(label?: Identifier, range?: [number, number]): BreakStatement;
	createReturnStatement(argument?: ExpressionNode, range?: [number, number]): ReturnStatement;
	createLabeledStatement(expression: Identifier, result: ExpressionNode, range?: [number, number]): LabeledStatement;
	createAssignmentPattern(left: DeclarationExpression, right: ExpressionNode, range?: [number, number]): AssignmentPattern;
	createSpreadElement(argument: ExpressionNode, range?: [number, number]): SpreadElement;
	createCommaListExpression(expressions: ExpressionNode[], range?: [number, number]): SequenceExpression;
	createTemplateExpression(quasis: string[], expressions: ExpressionNode[], range?: [number, number]): TemplateLiteral;
	createTaggedTemplateExpression(tag: ExpressionNode, quasis: string[], expressions: ExpressionNode[], range?: [number, number]): TaggedTemplateExpression;
	createNewExpression(className: ExpressionNode, parameters?: ExpressionNode[], range?: [number, number]): NewExpression;
	createObjectBindingPattern(properties: (Property | RestElement)[], range?: [number, number]): ObjectPattern;
	createObjectLiteralExpression(properties: Property[], range?: [number, number]): ObjectExpression;
	createArrayBindingPattern(elements: (DeclarationExpression | null)[], range?: [number, number]): ArrayPattern;
	createArrayLiteralExpression(elements: (ExpressionNode | SpreadElement | null)[], range?: [number, number]): ArrayExpression;
	createAssignment(operator: AssignmentOperator, left: ExpressionNode, right: ExpressionNode, range?: [number, number]): AssignmentExpression;
	createRestElement(argument: DeclarationExpression, range?: [number, number]): RestElement;
	createArrowFunction(params: DeclarationExpression[], body: ExpressionNode | ExpressionNode[], expression: boolean, async: boolean, range?: [number, number]): ArrowFunctionExpression;
	createPropertyDeclaration(key: ExpressionNode, value: DeclarationExpression | ExpressionNode, kind: 'init' | 'get' | 'set', method: boolean, shorthand: boolean, computed: boolean, range?: [number, number]): Property;
	createIdentifier(name: string, range?: [number, number]): Identifier;
	createPropertyAssignment(object: ExpressionNode, property: ExpressionNode, computed: boolean, optional?: boolean, range?: [number, number]): MemberExpression;
	createPipelineExpression(left: ExpressionNode, right: ExpressionNode, params?: (ExpressionNode | '?' | '...?')[], range?: [number, number]): PipelineExpression;
	createCallExpression(callee: ExpressionNode, params: ExpressionNode[], optional?: boolean, range?: [number, number]): CallExpression;
	createBindExpression(object: ExpressionNode, property: ExpressionNode, computed: boolean, optional?: boolean, range?: [number, number]): BindExpression;
	createChainExpression(expression: ExpressionNode, range?: [number, number]): ChainExpression;
	createLogicalExpression(operator: LogicalOperator, left: ExpressionNode, right: ExpressionNode, range?: [number, number],): LogicalExpression;
	createConditionalExpression(test: ExpressionNode, alternate: ExpressionNode, consequent: ExpressionNode, range?: [number, number]): ConditionalExpression;
	createYieldExpression(delegate: boolean, argument?: ExpressionNode, range?: [number, number]): YieldExpression;
	createMetaProperty(meta: Identifier, property: Identifier, range?: [number, number]): MetaProperty;
	createProgram(sourceType: ProgramSourceType, body: ExpressionNode[], range?: [number, number]): Program;
	createClassExpression(body: ClassBody, decorators: Decorator[], id?: Identifier, superClass?: ExpressionNode, range?: [number, number]): ClassExpression;
	createClassStaticBlockDeclaration(body: ExpressionNode[], range?: [number, number]): StaticBlock;
	createMethodSignature(kind: MethodDefinitionKind, key: ExpressionNode | PrivateIdentifier, value: FunctionExpression, decorators: Decorator[], computed: boolean, isStatic: boolean, range?: [number, number]): MethodDefinition;
	createPropertySignature(key: ExpressionNode | PrivateIdentifier, decorators: Decorator[], computed: boolean, isStatic: boolean, value?: ExpressionNode, range?: [number, number]): PropertyDefinition;
	createClassBody(body: (MethodDefinition | PropertyDefinition | AccessorProperty | StaticBlock)[], range?: [number, number]): ClassBody;
	createNamespaceExportDeclaration(specifiers: ExportSpecifier[], declaration?: DeclarationExpression, source?: Literal<string>, attributes?: ImportAttribute[], range?: [number, number]): ExportNamedDeclaration;
	createExportSpecifier(local: Identifier, exported: Identifier, range?: [number, number]): ExportSpecifier;
	createImportSpecifier(local: Identifier, imported: Identifier, range?: [number, number]): ImportSpecifier;
	createImportDeclaration(source: Literal<string>, specifiers?: (ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier)[], attributes?: ImportAttribute[], range?: [number, number]): ImportDeclaration;
	createImportNamespaceSpecifier(local: Identifier, range?: [number, number]): ImportNamespaceSpecifier;
	createImportDefaultSpecifier(local: Identifier, range?: [number, number]): ImportDefaultSpecifier;
	createImportExpression(source: Literal<string>, attributes?: ExpressionNode, range?: [number, number]): ImportExpression;
	createImportWithEntry(key: Identifier | Literal<string>, value: Literal<string>, range?: [number, number]): ImportAttribute;
	createExportDefault(declaration: FunctionDeclaration | ClassDeclaration | ExpressionNode, range?: [number, number],): ExportDefaultDeclaration;
	createExportAllDeclaration(source: Literal<string>, exported?: Identifier, attributes?: ImportAttribute[], range?: [number, number]): ExportAllDeclaration;
	createInfixExpression(operator: AssignmentOperator | LogicalOperator | BinaryOperator, left: ExpressionNode, right: ExpressionNode, range?: [number, number]): AssignmentExpression | LogicalExpression | BinaryExpression;
	createUnaryExpression(operator: UpdateOperator | UnaryOperator | 'await', expression: ExpressionNode, range?: [number, number]): UpdateExpression | UnaryExpression | AwaitExpression;
	createUpdateExpression(operator: UpdateOperator, argument: ExpressionNode, prefix: boolean, range?: [number, number]): UpdateExpression;
	createAwaitExpression(argument: ExpressionNode, range?: [number, number]): AwaitExpression;
	isIdentifier(node?: ExpressionNode): node is Identifier;
	isObjectExpression(node?: ExpressionNode): node is ObjectExpression;
	isArrayExpression(node?: ExpressionNode): node is ArrayExpression;
	isObjectPattern(node?: ExpressionNode): node is ObjectPattern;
	isArrayPattern(node?: ExpressionNode): node is ArrayPattern;
	isAssignmentPattern(node?: ExpressionNode): node is AssignmentPattern;
	isPattern(node?: ExpressionNode): boolean;
	canBePattern(node?: ExpressionNode): node is (ObjectExpression | ArrayExpression);
	isProperty(node?: ExpressionNode): node is Property;
	isMemberExpression(node?: ExpressionNode): node is MemberExpression;
	isPropertyOrMemberExpression(node?: ExpressionNode): node is (Property | MemberExpression);
	isEmptyStatement(expression: ExpressionNode): expression is EmptyStatement;
	isSequenceExpression(node: ExpressionNode): node is SequenceExpression;
	isSuper(node: ExpressionNode): node is Super;
	isAssignmentExpression(node: ExpressionNode): node is AssignmentExpression;
	isGroupingExpression(node: ExpressionNode): node is GroupingExpression;
	isSpreadElement(node: ExpressionNode): node is SpreadElement;
}
