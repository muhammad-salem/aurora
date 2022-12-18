import type { DeclarationExpression, ExpressionNode } from '../api/expression.js';
import { Token, TokenExpression } from './token.js';
import { TemplateStringLiteral, TokenStream } from './stream.js';
import { Identifier, TaggedTemplateExpression, TemplateLiteral, Literal, ThisExpression } from '../api/definition/values.js';
import { EmptyStatement } from '../api/statement/control/empty.js';
import { BlockStatement } from '../api/statement/control/block.js';
import {
	ArrowFunctionExpression, Param,
	FunctionExpression, FunctionDeclaration
} from '../api/definition/function.js';
import { IfStatement } from '../api/statement/control/if.js';
import { NewExpression } from '../api/computing/new.js';
import { SpreadElement } from '../api/computing/spread.js';
import { RestElement } from '../api/computing/rest.js';
import { AssignmentExpression, AssignmentOperator } from '../api/operators/assignment.js';
import { GroupingExpression } from '../api/operators/grouping.js';
import { MemberExpression } from '../api/definition/member.js';
import { BindExpression } from '../api/definition/bind.js';
import { ObjectExpression, Property, ObjectPattern } from '../api/definition/object.js';
import { ArrayExpression, ArrayPattern } from '../api/definition/array.js';
import { CallExpression } from '../api/computing/call.js';
import { DoWhileNode, WhileNode } from '../api/statement/iterations/while.js';
import { SwitchCase, DefaultExpression, SwitchStatement } from '../api/statement/control/switch.js';
import { BreakStatement, ContinueStatement, LabeledStatement } from '../api/statement/control/terminate.js';
import { ReturnStatement } from '../api/computing/return.js';
import { YieldExpression } from '../api/computing/yield.js';
import { VariableDeclarator, VariableDeclarationNode } from '../api/statement/declarations/declares.js';
import { ForNode, ForOfNode, ForInNode, ForAwaitOfNode, ForDeclaration } from '../api/statement/iterations/for.js';
import { ConditionalExpression } from '../api/operators/ternary.js';
import { PipelineExpression } from '../api/operators/pipeline.js';
import { LogicalExpression, LogicalOperator } from '../api/operators/logical.js';
import { SequenceExpression } from '../api/operators/comma.js';
import { ChainExpression } from '../api/operators/chaining.js';
import {
	buildPostfixExpression, buildUnaryExpression,
	expressionFromLiteral, shortcutNumericLiteralBinaryExpression
} from './nodes.js';
import { ClassDeclaration, ClassExpression, PrivateIdentifier, Super } from '../api/class/class.js';
import {
	AllowLabelledFunctionStatement,
	FunctionBodyType, FunctionInfo, FunctionKind,
	functionKindForImpl, FunctionSyntaxKind,
	isAsyncFunction, isAsyncGeneratorFunction,
	isAwaitAsIdentifierDisallowed, isClassMembersInitializerFunction,
	isGeneratorFunction, isModule, isResumableFunction, ParseFunctionFlag,
	ParsingArrowHeadFlag, PropertyKind, PropertyKindInfo,
	PropertyPosition, SubFunctionKind, VariableDeclarationContext
} from './enums.js';

import { isSloppy, isStrict, LanguageMode, } from './language.js';
import type { NodeFactory } from './node.js';
import { ExpressionNodeFactory } from './factory.js';



export type InlineParserOptions = { mode?: LanguageMode, acceptIN?: boolean, factory?: NodeFactory };

export abstract class AbstractParser {

	protected acceptIN: boolean;
	protected previousAcceptIN: boolean[] = [];

	protected functionKind: FunctionKind;
	protected previousFunctionKind: FunctionKind[] = [];
	get languageMode() {
		return this.scanner.getLanguageMode();
	}

	set languageMode(mode: LanguageMode) {
		this.scanner.setLanguageMode(mode);
	}

	constructor(protected scanner: TokenStream, protected factory: NodeFactory, acceptIN?: boolean) {
		this.previousAcceptIN.push(this.acceptIN = acceptIN ?? false);
		this.previousFunctionKind.push(this.functionKind = FunctionKind.NormalFunction);
	}
	abstract scan(): ExpressionNode;
	protected position() {
		return this.scanner.getPos();
	}
	protected setAcceptIN(acceptIN: boolean) {
		this.previousAcceptIN.push(this.acceptIN);
		this.acceptIN = acceptIN;
	}
	protected restoreAcceptIN() {
		this.acceptIN = this.previousAcceptIN.pop() ?? false;
	}
	protected getLastFunctionKind() {
		return this.previousFunctionKind.at(-2) ?? FunctionKind.NormalFunction;
	}
	protected setFunctionKind(functionKind: FunctionKind) {
		this.previousFunctionKind.push(this.functionKind);
		this.functionKind = functionKind;
	}
	protected restoreFunctionKind() {
		this.functionKind = this.previousFunctionKind.pop() ?? FunctionKind.NormalFunction;
	}
	protected setStatue(acceptIN: boolean, functionKind: FunctionKind) {
		this.setFunctionKind(functionKind);
		this.setAcceptIN(acceptIN);
	}
	protected restoreStatue() {
		this.restoreFunctionKind();
		this.restoreAcceptIN();
	}
	protected current() {
		return this.scanner.currentToken();
	}
	protected next() {
		return this.scanner.next();
	}
	protected peek(): TokenExpression {
		return this.scanner.peek();
	}
	protected peekAhead(): TokenExpression {
		return this.scanner.peekAhead();
	}
	protected peekAheadPosition() {
		return this.scanner.peekAheadPosition();
	}
	protected peekPosition() {
		return this.scanner.peekPosition();
	}
	protected consume(token: Token) {
		const next = this.scanner.next();
		if (next.isNotType(token)) {
			throw new Error(this.errorMessage(`Parsing ${JSON.stringify(token)}`));
		}
		return next;
	}
	protected check(token: Token): boolean {
		const next = this.scanner.peek();
		if (next.isType(token)) {
			this.scanner.next();
			return true;
		}
		return false;
	}
	protected checkAndGetValue(token: Token): ExpressionNode | undefined {
		const next = this.scanner.peek();
		if (next.isType(token)) {
			this.scanner.next();
			return next.value;
		}
		return undefined;
	}
	protected checkValue(value: ExpressionNode): boolean {
		const next = this.scanner.peek();
		if (next.value == value) {
			this.scanner.next();
			return true;
		}
		return false;
	}
	protected expect(token: Token) {
		const current = this.scanner.next();
		if (current.isNotType(token)) {
			throw new Error(this.errorMessage(`Unexpected Token: ${JSON.stringify(token)}, current is ${JSON.stringify(current)}`));
		}
		return current;
	}
	protected expectAndGetValue(token: Token) {
		const current = this.scanner.next();
		if (current.isNotType(token)) {
			throw new Error(this.errorMessage(`Unexpected Token: ${JSON.stringify(token)}, current is ${JSON.stringify(current)}`));
		}
		return current.getValue();
	}
	protected checkInOrOf(): 'IN' | 'OF' | false {
		const result = this.peekInOrOf();
		if (result) {
			this.scanner.next();
		}
		return result;
	}
	protected peekInOrOf(): 'IN' | 'OF' | false {
		var next = this.peek();
		if (next.isType(Token.IN)) {
			return 'IN';
		} else if (next.value instanceof Identifier && next.value.getName() === 'of') {
			return 'OF';
		}
		return false;
	}
	protected isArguments(name: ExpressionNode): boolean {
		return name instanceof Identifier && name.getName() === 'arguments';
	}
	protected isEval(name: ExpressionNode): boolean {
		return name instanceof Identifier && name.getName() === 'eval';
	}
	protected isEvalOrArguments(name: ExpressionNode): boolean {
		return name instanceof Identifier && (name.getName() === 'eval' || name.getName() === 'arguments');
	}
	protected isNextLetKeyword() {
		if (this.peek().isNotType(Token.LET)) {
			return false;
		}
		const nextNextToken = this.peekAhead().token;
		switch (nextNextToken) {
			case Token.LBRACE:
			case Token.LBRACK:
			case Token.IDENTIFIER:
			case Token.STATIC:
			case Token.LET:  // `let let;` is disallowed by static semantics, but the
			// token must be first interpreted as a keyword in order
			// for those semantics to apply. This ensures that ASI is
			// not honored when a LineTerminator separates the
			// tokens.
			case Token.YIELD:
			case Token.AWAIT:
			case Token.GET:
			case Token.SET:
			case Token.ASYNC:
				return true;
			default:
				return false;
		}
	}
	protected isIdentifier(expression: ExpressionNode): expression is Identifier {
		return expression instanceof Identifier;
	}
	protected markParenthesized(expression: ExpressionNode) {
		Reflect.set(expression, 'parenthesized', true);
	}
	protected clearParenthesized(expression: ExpressionNode) {
		Reflect.deleteProperty(expression, 'parenthesized');
	}
	protected isParenthesized(expression: ExpressionNode): boolean {
		return Reflect.get(expression, 'parenthesized') === true;
	}
	protected isAssignableIdentifier(expression: ExpressionNode): boolean {
		// return expression instanceof AssignmentNode;
		if (!(expression instanceof Identifier)) {
			return false;
		}
		if (isStrict(this.languageMode) && this.isEvalOrArguments(expression)) {
			return false;
		}
		return true;
	}
	protected isPattern(expression: ExpressionNode): expression is (ObjectExpression | ArrayExpression) {
		return expression instanceof ObjectExpression || expression instanceof ArrayExpression;
	}
	protected isProperty(expression: ExpressionNode): expression is Property | MemberExpression {
		return expression instanceof Property || expression instanceof MemberExpression;
	}
	protected isCallNew(expression: ExpressionNode): expression is NewExpression {
		return expression instanceof NewExpression;
	}
	protected isCall(expression: ExpressionNode): expression is CallExpression {
		return expression instanceof CallExpression;
	}
	protected isEmptyStatement(expression: ExpressionNode): expression is EmptyStatement {
		return expression instanceof EmptyStatement;
	}
	protected isValidReferenceExpression(expression: ExpressionNode): boolean {
		return this.isAssignableIdentifier(expression) || this.isProperty(expression);
	}
	protected expectSemicolon() {
		const tok = this.peek();
		if (tok.isType(Token.SEMICOLON)) {
			this.next();
			return;
		}
		if (this.scanner.hasLineTerminatorBeforeNext() || Token.isAutoSemicolon(tok.token)) {
			return;
		}
		if (this.scanner.currentToken().isType(Token.AWAIT) && !isAsyncFunction(this.functionKind)) {
			throw new Error(this.errorMessage(`Await Not In Async Context/Function`));
		}
	}
	protected peekAnyIdentifier() {
		return Token.isAnyIdentifier(this.peek().token);
	}
	protected expectContextualKeyword(keyword: string) {
		const current = this.scanner.next();
		if (!current.test((token, value) => Token.IDENTIFIER.equal(token) && keyword === value?.toString())) {
			throw new Error(this.errorMessage(`Unexpected Token: current Token is ${JSON.stringify(current)}`));
		}
		return true;
	}
	protected checkContextualKeyword(keyword: string) {
		const next = this.scanner.peek();
		if (next.test((token, value) => Token.IDENTIFIER.equal(token) && keyword === value?.toString())) {
			this.scanner.next();
			return true;
		}
		return false;
	}
	protected peekContextualKeyword(keyword: string) {
		const next = this.scanner.peek();
		return next.test((token, value) => Token.IDENTIFIER.equal(token) && keyword === value?.toString());
	}
	protected methodKindFor(isStatic: boolean, flag: ParseFunctionFlag): FunctionKind {
		return functionKindForImpl(
			isStatic ? SubFunctionKind.StaticMethod : SubFunctionKind.NonStaticMethod,
			flag
		);
	}
	protected isGenerator() {
		return isGeneratorFunction(this.functionKind);
	}
	protected isAsyncFunction() {
		return isAsyncFunction(this.functionKind);
	}
	protected is_async_function() {
		return isAsyncFunction(this.functionKind);
	}
	protected is_async_generator() {
		return isAsyncGeneratorFunction(this.functionKind);
	}
	protected is_resumable() {
		return isResumableFunction(this.functionKind);
	}
	protected isAwaitAllowed() {
		return this.isAsyncFunction() || isModule(this.functionKind);
	}
	protected isAwaitAsIdentifierDisallowed() {
		return isStrict(this.languageMode) ||
			isAwaitAsIdentifierDisallowed(this.functionKind);
	}
	protected shouldBanArguments() {
		return isClassMembersInitializerFunction(this.functionKind);
	}
	protected errorMessage(message: string): string {
		return this.scanner.createError(message);
	}

	protected reportErrorMessage(message: string): void {
		console.error(this.scanner.createError(message));
	}
}

export class JavaScriptInlineParser extends AbstractParser {
	static parse(source: string | TokenExpression[] | TokenStream, { mode, acceptIN, factory }: InlineParserOptions = {}) {
		mode ??= LanguageMode.Strict;
		const stream = (typeof source === 'string')
			? TokenStream.getTokenStream(source, mode)
			: Array.isArray(source) ? TokenStream.getTokenStream(source) : source;
		acceptIN ??= false;
		factory ??= new ExpressionNodeFactory();
		const parser = new JavaScriptInlineParser(stream, factory, acceptIN);
		return parser.scan();
	}
	constructor(scanner: TokenStream, factory: NodeFactory, acceptIN?: boolean) {
		super(scanner, factory, acceptIN);
	}
	scan(): ExpressionNode {
		const list: ExpressionNode[] = this.parseStatementList(Token.EOS);
		if (list.length === 1) {
			return list[0];
		}
		return this.factory.createExpressionStatement(list);
	}

	/**
	 * Statement ::
	 * Block
	 * VariableStatement
	 * EmptyStatement
	 * ExpressionStatement
	 * IfStatement
	 * IterationStatement
	 * ContinueStatement
	 * BreakStatement
	 * ReturnStatement
	 * WithStatement
	 * LabelledStatement
	 * SwitchStatement
	 * ThrowStatement
	 * TryStatement
	 * DebuggerStatement
	 */
	protected parseStatement(
		allowFunction: AllowLabelledFunctionStatement = AllowLabelledFunctionStatement.DisallowLabelledFunctionStatement
	): ExpressionNode {
		switch (this.peek().token) {
			case Token.LBRACE:
				return this.parseBlock();
			case Token.SEMICOLON:
				this.consume(Token.SEMICOLON);
				return this.factory.createEmptyStatement();
			case Token.IF:
				return this.parseIfStatement();
			case Token.DO:
				return this.parseDoWhileStatement();
			case Token.WHILE:
				return this.parseWhileStatement();
			case Token.FOR:
				if (this.isAwaitAllowed() && this.peekAhead().isType(Token.AWAIT)) {
					return this.parseForAwaitStatement();
				}
				return this.parseForStatement();
			case Token.CONTINUE:
				return this.parseContinueStatement();
			case Token.BREAK:
				return this.parseBreakStatement();
			case Token.RETURN:
				return this.parseReturnStatement();
			case Token.THROW:
				return this.parseThrowStatement();
			case Token.TRY:
				return this.parseTryStatement();
			case Token.SWITCH:
				return this.parseSwitchStatement();
			case Token.FUNCTION:
				throw new SyntaxError(this.errorMessage(`FunctionDeclaration only allowed as a StatementListItem not in an arbitrary Statement position.`));
			case Token.DEBUGGER:
				return this.parseDebuggerStatement();
			case Token.VAR:
				return this.parseVariableDeclarations(VariableDeclarationContext.Statement);
			case Token.ASYNC:
				if (!this.scanner.hasLineTerminatorAfterNext() && this.peekAhead().isType(Token.FUNCTION)) {
					throw new SyntaxError(this.errorMessage(`async function in single statement context.`));
				}
			default:
				return this.parseExpressionOrLabelledStatement(allowFunction);
		}
	}
	protected parseDebuggerStatement() {
		const token = this.consume(Token.DEBUGGER);
		this.expectSemicolon();
		return this.factory.createDebuggerStatement(token.range);
	}
	protected parseTryStatement(): ExpressionNode {
		// TryStatement ::
		//   'try' Block Catch
		//   'try' Block Finally
		//   'try' Block Catch Finally
		//
		// Catch ::
		//   'catch' '(' Identifier ')' Block
		//
		// Finally ::
		//   'finally' Block

		const tryToken = this.consume(Token.TRY);
		const tryBlock = this.parseBlock();
		const range: [number, number] = [tryToken.range[0], tryBlock.range?.[1] ?? -1];
		let peek = this.peek();
		if (peek.isNotType(Token.CATCH) && peek.isNotType(Token.FINALLY)) {
			throw new Error(this.errorMessage(`Uncaught SyntaxError: Missing catch or finally after try`));
		}
		let catchBlock: ExpressionNode | undefined;
		if (this.check(Token.CATCH)) {
			let identifier: ExpressionNode | undefined;
			const hasBinding = this.check(Token.LPAREN);
			if (hasBinding) {
				if (this.peekAnyIdentifier()) {
					identifier = this.parseNonRestrictedIdentifier();
				} else {
					identifier = this.parseBindingPattern(true);
				}
				this.expect(Token.RPAREN);
			}
			const block = this.parseBlock();
			catchBlock = this.factory.createCatchClause(block, identifier, block.range && [peek.range[0], block.range[1]]);
			range[1] = block.range?.[1] ?? -1;
		}
		let finallyBlock: ExpressionNode | undefined;
		if (this.check(Token.FINALLY)) {
			finallyBlock = this.parseBlock();
			range[1] = finallyBlock.range?.[1] ?? -1;
		}
		return this.factory.createTryStatement(tryBlock, catchBlock, finallyBlock, range[1] === -1 ? undefined : range);
	}
	protected parseNonRestrictedIdentifier() {
		const result = this.parseIdentifier();
		if (isStrict(this.languageMode) && this.isEvalOrArguments(result)) {
			throw new SyntaxError(this.errorMessage('Strict Eval/Arguments '));
		}
		return result;
	}
	protected parseBlock(): BlockStatement {
		const start = this.expect(Token.LBRACE);
		const statements: ExpressionNode[] = [];
		const range: [number, number] = [start.range[0], -1];
		const block = this.factory.createBlock(statements, range);
		while (this.peek().isNotType(Token.RBRACE)) {
			const stat = this.parseStatementListItem();
			if (!stat) {
				return block;
			} else if (stat instanceof EmptyStatement) {
				continue;
			}
			statements.push(stat);
		}
		const end = this.expect(Token.RBRACE);
		range[1] = end.range[1];
		return block;
	}
	/**
	 * ECMA 262 6th Edition
	 * 	StatementListItem[Yield, Return] :
	 * 	Statement[?Yield, ?Return]
	 * 	Declaration[?Yield]
	 * //
	 * Declaration[Yield] :
	 * 	HoistableDeclaration[?Yield]
	 * 	ClassDeclaration[?Yield]
	 * 	LexicalDeclaration[In, ?Yield]
	 * //
	 * HoistableDeclaration[Yield, Default] :
	 * 	FunctionDeclaration[?Yield, ?Default]
	 * 	GeneratorDeclaration[?Yield, ?Default]
	 * //
	 * LexicalDeclaration[In, Yield] :
	 * 	LetOrConst BindingList[?In, ?Yield] ;
	 */
	protected parseStatementListItem(): ExpressionNode | undefined {
		switch (this.peek().token) {
			case Token.FUNCTION:
				return this.parseHoistableDeclaration(undefined, false);
			case Token.CLASS:
				this.consume(Token.CLASS);
				return this.parseClassDeclaration(undefined, false);
			case Token.VAR:
			case Token.CONST:
				return this.parseVariableDeclarations(VariableDeclarationContext.StatementListItem);
			case Token.LET:
				if (this.isNextLetKeyword()) {
					return this.parseVariableDeclarations(VariableDeclarationContext.StatementListItem);
				}
				break;
			case Token.ASYNC:
				if (this.peekAhead().isType(Token.FUNCTION) && !this.scanner.hasLineTerminatorAfterNext()) {
					this.consume(Token.ASYNC);
					return this.parseAsyncFunctionDeclaration(undefined, false);
				}
				break;
			default:
				break;
		}
		return this.parseStatement(AllowLabelledFunctionStatement.AllowLabelledFunctionStatement);
	}
	protected parseFunctionExpression() {
		this.consume(Token.FUNCTION);
		const functionKind = this.check(Token.MUL) ? FunctionKind.GeneratorFunction : FunctionKind.NormalFunction;
		let name: Identifier | undefined;
		let functionSyntaxKind = FunctionSyntaxKind.AnonymousExpression;
		const peek = this.peek();
		if (peek.isNotType(Token.LPAREN)) {
			name = this.parseIdentifier(this.getLastFunctionKind());
			functionSyntaxKind = FunctionSyntaxKind.NamedExpression;
		}
		return this.parseFunctionLiteral(functionKind, functionSyntaxKind, name);
	}
	protected parseAsyncFunctionDeclaration(names: string[] | undefined, defaultExport: boolean): FunctionDeclaration {
		// AsyncFunctionDeclaration ::
		//   async [no LineTerminator here] function BindingIdentifier[Await]
		//       ( FormalParameters[Await] ) { AsyncFunctionBody }
		if (this.scanner.hasLineTerminatorBeforeNext()) {
			throw new SyntaxError(this.errorMessage('Line Terminator Before `function` parsing `async function`.'));
		}
		this.consume(Token.FUNCTION);
		return this.parseHoistableDeclaration01(FunctionKind.AsyncFunction, names, defaultExport) as FunctionDeclaration;

	}
	protected parseIfStatement(): ExpressionNode {
		this.consume(Token.IF);
		this.consume(Token.LPAREN);
		const condition = this.parseExpression();
		this.consume(Token.RPAREN);
		const thenStatement = this.parseScopedStatement();
		let elseStatement: ExpressionNode | undefined;
		if (this.peek().isType(Token.ELSE)) {
			this.consume(Token.ELSE);
			elseStatement = this.parseScopedStatement();
		}
		return new IfStatement(condition, thenStatement, elseStatement);
	}
	protected parseScopedStatement(): ExpressionNode {
		if (isStrict(this.languageMode) || this.peek().isNotType(Token.FUNCTION)) {
			return this.parseStatement();
		} else {
			return this.parseFunctionDeclaration();
		}
	}
	protected parseDoWhileStatement(): ExpressionNode {
		// DoStatement ::
		//   'do' Statement 'while' '(' Expression ')' ';'
		this.consume(Token.DO);
		const body = this.parseStatement();
		this.expect(Token.WHILE);
		this.expect(Token.LPAREN);
		const condition = this.parseExpression();
		this.expect(Token.RPAREN);
		this.check(Token.SEMICOLON);
		return new DoWhileNode(condition, body);
	}
	protected parseWhileStatement(): ExpressionNode {
		// WhileStatement ::
		//   'while' '(' Expression ')' Statement
		this.consume(Token.WHILE);
		this.expect(Token.LPAREN);
		const condition = this.parseExpression();
		this.expect(Token.RPAREN);
		const body = this.parseStatement();
		return new WhileNode(condition, body);
	}
	protected parseThrowStatement(): ExpressionNode {
		// ThrowStatement ::
		//   'throw' Expression ';'
		const throwToken = this.consume(Token.THROW);
		if (this.scanner.hasLineTerminatorBeforeNext()) {
			throw new Error(this.scanner.createError(`New line After Throw`));
		}
		const exception = this.parseExpression();
		this.expectSemicolon();
		const range: [number, number] | undefined = exception.range?.[1]
			? [throwToken.range[0], exception.range[1]]
			: undefined;
		return this.factory.createThrowStatement(exception, range);
	}
	protected parseSwitchStatement(): ExpressionNode {
		// SwitchStatement ::
		//   'switch' '(' Expression ')' '{' CaseClause* '}'
		// CaseClause ::
		//   'case' Expression ':' StatementList
		//   'default' ':' StatementList

		this.consume(Token.SWITCH);
		this.expect(Token.LPAREN);
		const tag = this.parseExpression();
		this.expect(Token.RPAREN);

		const cases: SwitchCase[] = [];
		const switchStatement = new SwitchStatement(tag, cases);

		let defaultSeen = false;
		this.expect(Token.LBRACE);
		while (this.peek().isNotType(Token.RBRACE)) {
			const statements: ExpressionNode[] = [];
			let label: ExpressionNode;
			if (this.check(Token.CASE)) {
				label = this.parseExpression();
			} else {
				this.expect(Token.DEFAULT);
				if (defaultSeen) {
					throw new Error(this.errorMessage(`Multiple Defaults In Switch`));
				}
				defaultSeen = true;
			}
			this.expect(Token.COLON);
			while (this.peek().isNotType(Token.CASE)
				&& this.peek().isNotType(Token.DEFAULT)
				&& this.peek().isNotType(Token.RBRACE)) {
				const statement = this.parseStatementListItem();
				if (!statement || this.isEmptyStatement(statement)) {
					continue;
				}
				statements.push(statement);
			}
			const block = new BlockStatement(statements);
			const clause = defaultSeen ? new DefaultExpression(block) : new SwitchCase(label!, block);
			cases.push(clause);
		}
		this.expect(Token.RBRACE);
		return switchStatement;
	}
	protected parseForStatement() {

		// Either a standard for loop
		//   for (<init>; <cond>; <next>) { ... }
		// or a for-each loop
		//   for (<each> of|in <iterable>) { ... }
		//
		// We parse a declaration/expression after the 'for (' and then read the first
		// expression/declaration before we know if this is a for or a for-each.
		//   typename FunctionState::LoopScope loop_scope(function_state_);

		this.consume(Token.FOR);
		this.expect(Token.LPAREN);
		const peek = this.peek();
		const starts_with_let = peek.isType(Token.LET);
		if (peek.isType(Token.CONST) || (starts_with_let && this.isNextLetKeyword())) {

			// The initializer contains lexical declarations,
			// so create an in-between scope.

			// Also record whether inner functions or evals are found inside
			// this loop, as this information is used to simplify the desugaring
			// if none are found.
			// typename FunctionState::FunctionOrEvalRecordingScope recording_scope(function_state_);
			const initializer = this.parseVariableDeclarations(VariableDeclarationContext.ForStatement);

			const forMode = this.checkInOrOf();
			if (forMode) {
				return this.parseForEachStatementWithDeclarations(initializer, forMode);
			}

			this.expect(Token.SEMICOLON);

			// Parse the remaining code in the inner block scope since the declaration
			// above was parsed there. We'll finalize the unnecessary outer block scope
			// after parsing the rest of the loop.
			return this.parseStandardForLoopWithLexicalDeclarations(initializer);
		}

		let initializer: ExpressionNode;
		if (peek.isType(Token.VAR)) {
			initializer = this.parseVariableDeclarations(VariableDeclarationContext.ForStatement);
			// ParseVariableDeclarations(kForStatement, & for_info.parsing_result,& for_info.bound_names);
			// DCHECK_EQ(for_info.parsing_result.descriptor.mode, VariableMode:: kVar);
			// for_info.position = scanner() -> location().beg_pos;
			const forMode = this.checkInOrOf();
			if (forMode) {
				return this.parseForEachStatementWithDeclarations(initializer as VariableDeclarationNode, forMode);
			}
			// init = impl() -> BuildInitializationBlock(& for_info.parsing_result);
		} else if (this.peek().isNotType(Token.SEMICOLON)) {
			// The initializer does not contain declarations.
			this.setAcceptIN(false);
			initializer = this.parseExpressionCoverGrammar();
			this.restoreAcceptIN();
			//   ExpressionParsingScope parsing_scope(impl());
			//   AcceptINScope scope(this, false);
			// `for (async of` is disallowed but `for (async.x of` is allowed, so
			// check if the token is ASYNC after parsing the expression.
			// Initializer is reference followed by in/of.
			const expression_is_async = this.current().isType(Token.ASYNC);
			const forMode = this.checkInOrOf();
			if (forMode) {
				if (forMode === 'OF' && starts_with_let || expression_is_async) {
					throw new SyntaxError(this.errorMessage(starts_with_let ? 'For Of Let' : 'For Of Async'));
				}
				return this.parseForEachStatementWithoutDeclarations(initializer, forMode)
			}
		}

		this.expect(Token.SEMICOLON);
		return this.parseStandardForLoop(initializer!);
	}
	protected parseStandardForLoopWithLexicalDeclarations(initializer: VariableDeclarationNode) {
		// The condition and the next statement of the for loop must be parsed
		// in a new scope.
		return this.parseStandardForLoop(initializer);
	}
	protected parseForEachStatementWithDeclarations(initializer: VariableDeclarationNode, forMode: 'IN' | 'OF') {
		// Just one declaration followed by in/of.
		if (initializer.getDeclarations().length != 1) {
			throw new SyntaxError(this.errorMessage('For In/Of loop Multi Bindings'));
		}
		return this.parseForEachStatementWithoutDeclarations(initializer, forMode);
	}
	protected parseForEachStatementWithoutDeclarations(initializer: ExpressionNode, forMode: 'IN' | 'OF') {
		let enumerable: ExpressionNode;
		if (forMode == 'OF') {
			this.setAcceptIN(true);
			enumerable = this.parseAssignmentExpression();
			this.restoreAcceptIN();
		} else {
			enumerable = this.parseExpression();
		}
		this.expect(Token.RPAREN);
		const body = this.parseStatement();
		if (forMode === 'OF') {
			return new ForOfNode(initializer as ForDeclaration, enumerable, body);
		} else if (forMode === 'IN') {
			return new ForInNode(initializer as ForDeclaration, enumerable, body);
		} else {
			throw new Error(this.errorMessage(`parsing for loop: ${this.position()}`));
		}
	}
	protected parseStandardForLoop(initializer: ExpressionNode) {
		// CheckStackOverflow();
		//   ForStatementT loop = factory() -> NewForStatement(stmt_pos);
		//   Target target(this, loop, labels, own_labels, Target:: TARGET_FOR_ANONYMOUS);

		let cond: ExpressionNode = new EmptyStatement();
		if (this.peek().isNotType(Token.SEMICOLON)) {
			cond = this.parseExpression();
		}
		this.expect(Token.SEMICOLON);

		let next: ExpressionNode = new EmptyStatement();
		if (this.peek().isNotType(Token.RPAREN)) {
			next = this.parseExpression();
		}
		this.expect(Token.RPAREN);
		const body = this.parseStatement();
		return new ForNode(body, initializer, cond, next);
	}
	protected parseForAwaitStatement() {
		// for await '(' ForDeclaration of AssignmentExpression ')'

		// Create an in-between scope for let-bound iteration variables.
		//   BlockState for_state(zone(), & scope_);
		if (!this.isAwaitAllowed()) {
			throw new SyntaxError(this.errorMessage('"await" is not allowed'));
		}
		this.expect(Token.FOR);
		this.expect(Token.AWAIT);
		this.expect(Token.LPAREN);

		let hasDeclarations = false;
		// Scope * inner_block_scope = NewScope(BLOCK_SCOPE);
		let eachVariable: ExpressionNode;

		let peek = this.peek();
		let startsWithLet = peek.isType(Token.LET);
		if (peek.isType(Token.VAR) || peek.isType(Token.CONST)
			|| (startsWithLet && this.isNextLetKeyword())) {
			// The initializer contains declarations
			// 'for' 'await' '(' ForDeclaration 'of' AssignmentExpression ')'
			//     Statement
			// 'for' 'await' '(' 'var' ForBinding 'of' AssignmentExpression ')'
			//     Statement
			hasDeclarations = true;
			const initializer = this.parseVariableDeclarations(VariableDeclarationContext.ForStatement);
			if (initializer.getDeclarations().length != 1) {
				throw new SyntaxError(this.errorMessage('For In/Of Loop MultiBindings, "for-await-of"'));
			}
			eachVariable = initializer;
		} else {
			// The initializer does not contain declarations.
			// 'for' 'await' '(' LeftHandSideExpression 'of' AssignmentExpression ')'
			//     Statement
			if (startsWithLet) {
				throw new SyntaxError(this.errorMessage('The initializer does not contain declarations, For Of Let, "for-await-of"'));
			}
			eachVariable = this.parseLeftHandSideExpression();
		}

		this.expectContextualKeyword('of');
		this.setAcceptIN(true);
		const iterable = this.parseAssignmentExpression();
		this.restoreAcceptIN();
		this.expect(Token.RPAREN);
		const body = this.parseStatement();
		return new ForAwaitOfNode(eachVariable as ForDeclaration, iterable, body);
	}
	protected parseVariableDeclarations(varContext: VariableDeclarationContext): VariableDeclarationNode {
		// VariableDeclarations ::
		//   ('var' | 'const' | 'let') (Identifier ('=' AssignmentExpression)?)+[',']
		// var converted into ==> 'let' by parser

		let mode: 'const' | 'let' | 'var';
		const token = this.peek().token;
		switch (token) {
			case Token.CONST:
				this.consume(token);
				mode = 'const';
				break;
			case Token.VAR:
				this.consume(token);
				mode = 'var';
				break;
			case Token.LET:
			default:
				this.consume(token);
				mode = 'let';
				break;
		}
		const variables: VariableDeclarator[] = [];
		do {

			let name: ExpressionNode;
			let value: ExpressionNode | undefined;
			// Check for an identifier first, so that we can elide the pattern in cases
			// where there is no initializer (and so no proxy needs to be created).
			if (Token.isAnyIdentifier(this.peek().token)) {
				name = this.parseAndClassifyIdentifier(this.next());
				if (isStrict(this.languageMode) && this.isEvalOrArguments(name)) {
					throw new Error(this.errorMessage(`Strict Eval Arguments`));
				}
				// if (this.peekInOrOf()) {
				// 	// // Assignments need the variable expression for the assignment LHS, and
				// 	// // for of/in will need it later, so create the expression now.
				// }
			} else {
				name = this.parseBindingPattern(true);
			}

			if (this.check(Token.ASSIGN)) {
				this.setAcceptIN(varContext !== VariableDeclarationContext.ForStatement)
				value = this.parseAssignmentExpression();
				this.restoreAcceptIN();
			} else if (!this.peekInOrOf()) {
				// ES6 'const' and binding patterns require initializers.
				if (mode === 'const' && (name === undefined || value === undefined)) {
					throw new Error(this.errorMessage(`Declaration Missing Initializer`));
				}
				// value = undefined;
			}
			variables.push(new VariableDeclarator(name as DeclarationExpression, value));
		} while (this.check(Token.COMMA));
		return new VariableDeclarationNode(variables, mode);
	}
	protected parseBindingPattern(isPattern: boolean): ExpressionNode {
		// Pattern ::
		//   Identifier
		//   ArrayLiteral
		//   ObjectLiteral

		const token = this.peek().token;
		if (Token.isAnyIdentifier(token)) {
			const name = this.parseAndClassifyIdentifier(this.next());
			if (isStrict(this.languageMode) && this.isEvalOrArguments(name)) {
				throw new Error(this.errorMessage(`Strict Eval Arguments`));
			}
			return name;
		}
		if (token == Token.LBRACK) {
			return this.parseArrayLiteral(isPattern);
		} else if (token == Token.LBRACE) {
			return this.parseObjectLiteral(isPattern);
		} else {
			throw new Error(this.errorMessage(`Unexpected Token: ${this.next().getValue()}`));
		}
	}
	protected parseAndClassifyIdentifier(next: TokenExpression): ExpressionNode {
		// Updates made here must be reflected on ClassifyPropertyIdentifier.
		if (Token.isInRangeIdentifierAndAsync(next.token)) {
			const name = next.getValue<Identifier>();
			if (this.isArguments(name) && this.shouldBanArguments()) {
				throw new SyntaxError(this.errorMessage('Arguments Disallowed In Initializer And Static Block'));
			}
			return name;
		}

		if (!Token.isValidIdentifier(next.token, this.languageMode, this.isGenerator(), this.isAwaitAsIdentifierDisallowed())) {
			throw new SyntaxError(this.errorMessage('Invalid Identifier'));
		}

		if (next.isType(Token.AWAIT)) {
			return next.getValue<Identifier>();
		}

		return next.getValue<Identifier>();
	}
	protected parseContinueStatement(): ExpressionNode {
		// ContinueStatement ::
		//   'continue' ';'
		// Identifier? is not supported

		this.consume(Token.CONTINUE);
		let label: Identifier | undefined;
		if (!this.scanner.hasLineTerminatorBeforeNext() &&
			!Token.isAutoSemicolon(this.peek().token)) {
			// ECMA allows "eval" or "arguments" as labels even in strict mode.
			label = this.parseIdentifier();
		}
		this.expectSemicolon();
		return new ContinueStatement(label);
	}
	protected parseBreakStatement(): ExpressionNode {
		// BreakStatement ::
		//   'break' ';'
		// Identifier? is not supported

		this.consume(Token.BREAK); let label: Identifier | undefined;
		if (!this.scanner.hasLineTerminatorBeforeNext() &&
			!Token.isAutoSemicolon(this.peek().token)) {
			// ECMA allows "eval" or "arguments" as labels even in strict mode.
			label = this.parseIdentifier();
		}
		this.expectSemicolon();
		return new BreakStatement(label);
	}
	protected parseReturnStatement(): ExpressionNode {
		// ReturnStatement ::
		//   'return' [no line terminator] Expression? ';'

		// Consume the return token. It is necessary to do that before
		// reporting any errors on it, because of the way errors are
		// reported (underlining).
		this.consume(Token.RETURN);
		const tokenExp = this.peek();
		let returnValue: ExpressionNode | undefined;
		// ExpressionT return_value = impl() -> NullExpression();
		if (this.scanner.hasLineTerminatorBeforeNext() || Token.isAutoSemicolon(tokenExp.token)) {
			// check if this scope is belong to 'constructor' method to return this at the end;
			// if (this.isDerivedConstructor(this.functionKind)) {
			// 	returnValue = ThisNode;
			// }
		} else {
			returnValue = this.parseExpression();
		}
		this.expectSemicolon()
		return new ReturnStatement(returnValue);
	}
	protected parseExpressionOrLabelledStatement(allowFunction: AllowLabelledFunctionStatement): ExpressionNode {
		// ExpressionStatement | LabelledStatement ::
		//   Expression ';'
		//   Identifier ':' Statement
		//
		// ExpressionStatement[Yield] :
		//   [lookahead notin {{, function, class, let [}] Expression[In, ?Yield] ;

		switch (this.peek().token) {
			case Token.FUNCTION:
			case Token.LBRACE:
				throw new Error(this.errorMessage(`Unreachable state`));
			case Token.CLASS:
				throw new Error(this.errorMessage(`Unexpected Token ${this.next().getValue().toString()}`));
			case Token.LET: {
				const nextNext = this.peekAhead();
				// "let" followed by either "[", "{" or an identifier means a lexical
				// declaration, which should not appear here.
				// However, ASI may insert a line break before an identifier or a brace.
				if (nextNext.isNotType(Token.LBRACK) &&
					((nextNext.isNotType(Token.LBRACE) && nextNext.isNotType(Token.IDENTIFIER)))) {
					break;
				}
				throw new Error(this.errorMessage(`Unexpected Lexical Declaration ${this.position()}`));
			}
			default:
				break;
		}
		const startsWithIdentifier = Token.isAnyIdentifier(this.peek().token);
		this.setAcceptIN(true);
		const expression: ExpressionNode = this.parseExpressionCoverGrammar();
		if (this.peek().isType(Token.COLON) && startsWithIdentifier && this.isIdentifier(expression)) {
			// The whole expression was a single identifier, and not, e.g.,
			// something starting with an identifier or a parenthesized identifier.

			// Remove the "ghost" variable that turned out to be a label from the top
			// scope. This way, we don't try to resolve it during the scope
			// processing.

			this.consume(Token.COLON);
			// ES#sec-labelled-function-declarations Labelled Function Declarations
			if (this.peek().isType(Token.FUNCTION)
				&& isSloppy(this.languageMode)
				&& allowFunction == AllowLabelledFunctionStatement.AllowLabelledFunctionStatement) {
				const result = this.parseFunctionDeclaration();
				this.restoreAcceptIN();
				return new LabeledStatement(expression, result);
			}
			const result = this.parseStatement(allowFunction);
			this.restoreAcceptIN();
			return new LabeledStatement(expression, result);
		}
		this.restoreAcceptIN();
		// Parsed expression statement, followed by semicolon.
		this.expectSemicolon();
		return expression;
	}
	protected parseExpression(): ExpressionNode {
		this.setAcceptIN(true);
		const result = this.parseExpressionCoverGrammar();
		this.restoreAcceptIN();
		return result;
	}
	protected parseFunctionDeclaration(): FunctionDeclaration {
		this.consume(Token.FUNCTION);
		if (this.check(Token.MUL)) {
			throw new Error(this.errorMessage(`Error Generator In Single Statement Context`));
		}
		return this.parseHoistableDeclaration01(FunctionKind.NormalFunction, undefined, false) as FunctionDeclaration;
	}

	protected parseAsyncFunctionLiteral() {
		// AsyncFunctionLiteral ::
		//   async [no LineTerminator here] function ( FormalParameters[Await] )
		//       { AsyncFunctionBody }
		//
		//   async [no LineTerminator here] function BindingIdentifier[Await]
		//       ( FormalParameters[Await] ) { AsyncFunctionBody }
		if (this.current().isNotType(Token.ASYNC)) {
			throw new SyntaxError(this.errorMessage('invalid token'));
		}
		this.consume(Token.FUNCTION);
		let name: Identifier | undefined;
		let syntaxKind = FunctionSyntaxKind.AnonymousExpression;
		let flags = FunctionKind.AsyncFunction;
		if (this.check(Token.MUL)) {
			flags = FunctionKind.AsyncGeneratorFunction;
		}
		if (this.peekAnyIdentifier()) {
			syntaxKind = FunctionSyntaxKind.NamedExpression;
			name = this.parseIdentifier(this.getLastFunctionKind());
		}
		return this.parseFunctionLiteral(flags, syntaxKind, name);
	}
	protected parseHoistableDeclaration(names: string[] | undefined, defaultExport: boolean) {
		this.consume(Token.FUNCTION);
		let flags = FunctionKind.NormalFunction;
		if (this.check(Token.MUL)) {
			flags = FunctionKind.GeneratorFunction;
		}
		return this.parseHoistableDeclaration01(flags, names, defaultExport);
	}

	protected parseHoistableDeclaration01(flag: FunctionKind, names: string[] | undefined, defaultExport: boolean) {
		// FunctionDeclaration ::
		//   'function' Identifier '(' FormalParameters ')' '{' FunctionBody '}'
		//   'function' '(' FormalParameters ')' '{' FunctionBody '}'
		// GeneratorDeclaration ::
		//   'function' '*' Identifier '(' FormalParameters ')' '{' FunctionBody '}'
		//   'function' '*' '(' FormalParameters ')' '{' FunctionBody '}'
		//
		// The anonymous forms are allowed iff [default_export] is true.
		//
		// 'function' and '*' (if present) have been consumed by the caller.

		// (FunctionType.ASYNC === flag || FunctionType.GENERATOR === flag);

		if ((flag & ParseFunctionFlag.IsAsync) != 0 && this.check(Token.MUL)) {
			// Async generator
			flag |= ParseFunctionFlag.IsGenerator;
		}

		let name: Identifier | undefined;
		if (this.peek().isType(Token.LPAREN)) {
			if (defaultExport) {
				name = new Identifier('default');
			} else {
				throw new SyntaxError(this.errorMessage('Missing Function Name'));
			}
		} else {
			name = this.parseIdentifier(this.getLastFunctionKind());
		}
		names?.push(name.toString());
		return this.parseFunctionLiteral(flag, FunctionSyntaxKind.Declaration, name);
	}
	protected parseIdentifier(kind?: FunctionKind): Identifier {
		kind ??= this.functionKind;
		const next = this.next();
		if (!Token.isValidIdentifier(next.token, this.languageMode, isGeneratorFunction(kind), isAwaitAsIdentifierDisallowed(kind))) {
			throw new Error(this.errorMessage(`Unexpected Token: ${next.getValue()}`));
		}
		if (next.isType(Token.IDENTIFIER)) {
			return next.getValue<Identifier>();
		}
		return this.getIdentifier();
	}
	protected getIdentifier(): Identifier {
		const current = this.current();
		switch (current.token) {
			case Token.AWAIT:
				return new Identifier('await');
			case Token.ASYNC:
				return new Identifier('async');
			case Token.IDENTIFIER:
			case Token.PRIVATE_NAME:
				return current.getValue();
			default:
				break;
		}
		const name = current.getValue().toString();
		if (name == 'constructor') {
			return new Identifier('constructor');
		}
		if (name == 'name') {
			return new Identifier('name');
		}
		if (name == 'eval') {
			return new Identifier('eval');
		}
		else if (name == 'arguments') {
			return new Identifier('arguments');
		}
		return current.getValue();
	}
	protected parseFunctionLiteral(flag: FunctionKind, functionSyntaxKind: FunctionSyntaxKind, name?: Identifier): FunctionDeclaration | FunctionExpression {
		// Function ::
		//   '(' FormalParameterList? ')' '{' FunctionBody '}'

		this.setFunctionKind(flag);
		const functionInfo: FunctionInfo = {};
		this.expect(Token.LPAREN);
		const formals: ExpressionNode[] = this.parseFormalParameterList(functionInfo);
		this.expect(Token.RPAREN);
		this.expect(Token.LBRACE);
		this.setAcceptIN(true);
		const body = this.parseFunctionBody(flag, FunctionBodyType.BLOCK, functionSyntaxKind);
		this.restoreAcceptIN();
		this.restoreFunctionKind();
		const bodyBlock = new BlockStatement(body);
		if (name) {
			return new FunctionDeclaration(formals, bodyBlock, isAsyncFunction(flag), isGeneratorFunction(flag), name);
		}
		return new FunctionExpression(formals, bodyBlock, isAsyncFunction(flag), isGeneratorFunction(flag));
	}
	protected parseFunctionBody(
		kind: FunctionKind,
		bodyType: FunctionBodyType.BLOCK,
		functionSyntaxKind: FunctionSyntaxKind): ExpressionNode[];
	protected parseFunctionBody(
		kind: FunctionKind,
		bodyType: FunctionBodyType.EXPRESSION,
		functionSyntaxKind: FunctionSyntaxKind): ExpressionNode
	protected parseFunctionBody(
		kind: FunctionKind,
		bodyType: FunctionBodyType,
		functionSyntaxKind: FunctionSyntaxKind): ExpressionNode[] | ExpressionNode {
		// Building the parameter initialization block declares the parameters.
		// TODO(verwaest): Rely on ArrowHeadParsingScope instead.

		let innerBody: ExpressionNode[] | ExpressionNode;
		if (bodyType == FunctionBodyType.EXPRESSION) {
			innerBody = this.parseAssignmentExpression();
		} else {
			// DCHECK(accept_IN_);
			// DCHECK_EQ(FunctionBodyType:: kBlock, body_type);
			// If we are parsing the source as if it is wrapped in a function, the
			// source ends without a closing brace.
			const closing_token = functionSyntaxKind == FunctionSyntaxKind.Wrapped ? Token.EOS : Token.RBRACE;

			if (isAsyncGeneratorFunction(kind)) {
				innerBody = this.parseAndRewriteAsyncGeneratorFunctionBody(kind);
			} else if (isGeneratorFunction(kind)) {
				innerBody = this.parseAndRewriteGeneratorFunctionBody(kind);
			} else if (isAsyncFunction(kind)) {
				innerBody = this.parseAsyncFunctionBody();
			} else {
				innerBody = this.parseStatementList(closing_token);
			}
			this.expect(closing_token);
		}
		return innerBody;
	}
	protected parseAndRewriteAsyncGeneratorFunctionBody(kind: FunctionKind): ExpressionNode[] {
		return this.parseStatementList(Token.RBRACE);
	}
	protected parseAndRewriteGeneratorFunctionBody(kind: FunctionKind): ExpressionNode[] {
		return this.parseStatementList(Token.RBRACE);
	}
	protected parseAsyncFunctionBody(): ExpressionNode[] {
		return this.parseStatementList(Token.RBRACE);
	}
	protected parseStatementList(endToken: Token): ExpressionNode[] {
		// StatementList ::
		//   (StatementListItem)* <end_token>
		if (this.peek().test((token, value) => Token.STRING === token && 'use strict' === (value as Literal<string>).getValue())) {
			this.languageMode = LanguageMode.Strict;
		}
		const list: ExpressionNode[] = [];
		while (this.peek().isNotType(endToken)) {
			const stat = this.parseStatementListItem();
			if (!stat) {
				break;
			}
			if (this.isEmptyStatement(stat)) {
				continue;
			}
			list.push(stat);
		}
		return list;
	}
	protected parseFormalParameterList(functionInfo: FunctionInfo): ExpressionNode[] {
		// FormalParameters[Yield] :
		//   [empty]
		//   FunctionRestParameter[?Yield]
		//   FormalParameterList[?Yield]
		//   FormalParameterList[?Yield] ,
		//   FormalParameterList[?Yield] , FunctionRestParameter[?Yield]
		//
		// FormalParameterList[Yield] :
		//   FormalParameter[?Yield]
		//   FormalParameterList[?Yield] , FormalParameter[?Yield]

		const parameters: ExpressionNode[] = [];
		if (this.peek().isNotType(Token.RPAREN)) {
			while (true) {
				const param: ExpressionNode = this.parseFormalParameter(functionInfo);
				parameters.push(param);
				if (functionInfo.rest) {
					if (this.peek().isType(Token.COMMA)) {
						throw new Error(this.errorMessage(`Param After Rest`));
					}
					break;
				}
				if (!this.check(Token.COMMA)) break;
				if (this.peek().isType(Token.RPAREN)) {
					// allow the trailing comma
					break;
				}
			}
		}
		return parameters;
	}
	protected parseFormalParameter(functionInfo: FunctionInfo): ExpressionNode {
		// FormalParameter[Yield,GeneratorParameter] :
		//   BindingElement[?Yield, ?GeneratorParameter]
		functionInfo.rest = this.check(Token.ELLIPSIS);
		const pattern = this.parseBindingPattern(true);
		let initializer: Param;
		if (this.check(Token.ASSIGN)) {
			if (functionInfo.rest) {
				throw new Error(this.errorMessage(`Rest Default Initializer`));
			}
			this.setAcceptIN(true);
			const value = this.parseAssignmentExpression();
			this.restoreAcceptIN();
			initializer = new Param(this.checkParamType(pattern as DeclarationExpression), value);
		} else {
			initializer = new Param(this.checkParamType(pattern as DeclarationExpression));
		}
		return initializer;
	}
	protected parseExpressionCoverGrammar(): ExpressionNode {
		// Expression ::
		//   AssignmentExpression
		//   Expression ',' AssignmentExpression

		const list: ExpressionNode[] = [];
		let expression: ExpressionNode;
		while (true) {
			if (this.peek().isType(Token.ELLIPSIS)) {
				return this.parseArrowParametersWithRest(list);
			}
			expression = this.parseAssignmentExpressionCoverGrammar();
			list.push(expression);

			if (!this.check(Token.COMMA)) break;

			if (this.peek().isType(Token.RPAREN) && this.peekAhead().isType(Token.ARROW)) {
				// a trailing comma is allowed at the end of an arrow parameter list
				break;
			}
		}
		if (list.length == 1) return expression;
		return this.expressionListToExpression(list);
	}
	protected parseArrowParametersWithRest(list: ExpressionNode[]): ExpressionNode {
		this.consume(Token.ELLIPSIS);
		const pattern: ExpressionNode = this.parseBindingPattern(true);
		if (this.peek().isType(Token.ASSIGN)) {
			throw new Error(this.errorMessage(`Error A rest parameter cannot have an initializer`));
		}
		if (this.peek().isType(Token.COMMA)) {
			throw new Error(this.errorMessage(`Error A rest parameter or binding pattern may not have a trailing comma`));
		}
		// 'x, y, ...z' in CoverParenthesizedExpressionAndArrowParameterList only
		// as the formal parameters of'(x, y, ...z) => foo', and is not itself a
		// valid expression.
		if (this.peek().isNotType(Token.RPAREN) || this.peekAhead().isNotType(Token.ARROW)) {
			throw new Error(this.errorMessage(`Error Unexpected Token At ${this.position()}`));
		}
		list.push(new SpreadElement(pattern));
		return this.expressionListToExpression(list);
	}
	protected expressionListToExpression(list: ExpressionNode[]): ExpressionNode {
		const first = list[0];
		if (list.length === 1) { return first; }
		if (first instanceof SequenceExpression) {
			first.getExpressions().push(...list.slice(1));
			return first;
		}
		return new SequenceExpression(list);
	}
	protected parseMemberExpression(): ExpressionNode {
		// MemberExpression ::
		//   (PrimaryExpression | FunctionLiteral | ClassLiteral)
		//     ('[' Expression ']' | '.' Identifier | Arguments | TemplateLiteral)*
		//
		// CallExpression ::
		//   (SuperCall | ImportCall)
		//     ('[' Expression ']' | '.' Identifier | Arguments | TemplateLiteral)*
		//
		// The '[' Expression ']' and '.' Identifier parts are parsed by
		// ParseMemberExpressionContinuation, and everything preceeding it is merged
		// into ParsePrimaryExpression.

		// Parse the initial primary or function expression.
		const result = this.parsePrimaryExpression();
		return this.parseMemberExpressionContinuation(result);
	}
	protected toParamNode(expression: ExpressionNode): Param {
		if (expression instanceof AssignmentExpression) {
			return new Param(expression.getLeft() as DeclarationExpression, expression.getRight());
		}
		if (expression instanceof GroupingExpression) {
			return new Param(expression.getNode() as DeclarationExpression);
		}
		return new Param(expression as DeclarationExpression);
	}
	protected parsePrimaryExpression(): ExpressionNode {
		// PrimaryExpression ::
		//   'this'
		//   'null'
		//   'true'
		//   'false'
		//   Identifier
		//   Number
		//   String
		//   ArrayLiteral
		//   ObjectLiteral
		//   RegExpLiteral
		//   '(' Expression ')'
		//   do Block
		//   AsyncFunctionLiteral

		let token = this.peek();
		if (Token.isAnyIdentifier(token.token)) {
			this.consume(token.token);
			let kind = FunctionKind.NormalFunction;
			if (token.isType(Token.ASYNC) && !this.scanner.hasLineTerminatorBeforeNext()) {
				// async function ...
				if (this.peek().isType(Token.FUNCTION)) {
					return this.parseAsyncFunctionLiteral();
				};
				// async Identifier => ...
				if (Token.isAnyIdentifier(this.peek().token) && this.peekAhead().isType(Token.ARROW)) {
					token = this.next();
					kind = FunctionKind.AsyncFunction;
				}
			}
			if (this.peek().isType(Token.ARROW)) {
				this.setFunctionKind(kind);
				const name = this.parseAndClassifyIdentifier(token);
				const params: Param[] = [];
				if (name instanceof SequenceExpression) {
					params.push(...name.getExpressions().map(this.toParamNode));
				} else {
					params.push(this.toParamNode(name));
				}
				const arrow = this.parseArrowFunctionLiteral(params, kind);
				this.restoreFunctionKind();
				return arrow;
			}
			return this.parseAndClassifyIdentifier(token);
		}

		if (Token.isLiteral(token.token)) {
			return expressionFromLiteral(this.next());
		}

		switch (token.token) {
			case Token.NEW:
				return this.parseMemberWithPresentNewPrefixesExpression();
			case Token.THIS:
				this.consume(Token.THIS);
				return new ThisExpression();
			case Token.DIV:
			case Token.DIV_ASSIGN:
				// case Token.REGEXP_LITERAL:
				// this.consume(Token.REGEXP_LITERAL);
				// return token.value!;
				return this.parseRegExpLiteral();
			case Token.FUNCTION:
				return this.parseFunctionExpression();
			case Token.SUPER: {
				return this.parseSuperExpression();
			}
			case Token.IMPORT:
				return this.parseImportExpressions();

			case Token.LBRACK:
				return this.parseArrayLiteral(false);

			case Token.LBRACE:
				return this.parseObjectLiteral(false);

			case Token.LPAREN: {
				this.consume(Token.LPAREN);
				if (this.check(Token.RPAREN)) {
					// ()=>x.  The continuation that consumes the => is in
					// ParseAssignmentExpressionCoverGrammar.

					if (!this.peek().isType(Token.ARROW)) {
						throw new Error(this.errorMessage(`Unexpected Token: ${Token.RPAREN.getName()}`));
					}
					const result = new SequenceExpression([]);
					this.markParenthesized(result);
					return result;
				}
				// Heuristically try to detect immediately called functions before
				// seeing the call parentheses.

				this.setAcceptIN(true);
				const expression = this.parseExpressionCoverGrammar();
				this.markParenthesized(expression);
				this.expect(Token.RPAREN);
				this.restoreAcceptIN();
				return expression;
			}
			case Token.CLASS: {
				return this.parseClassExpression();
			}
			case Token.TEMPLATE_SPAN:
			case Token.TEMPLATE_TAIL:
				return this.parseTemplateLiteral();
			default:
				break;
		}
		throw new Error(this.errorMessage(`Unexpected Token: ${JSON.stringify(this.next())}`));
	}
	protected parseTemplateLiteral(tag?: ExpressionNode): ExpressionNode {
		// A TemplateLiteral is made up of 0 or more TEMPLATE_SPAN tokens (literal
		// text followed by a substitution expression), finalized by a single
		// TEMPLATE_TAIL.
		//
		// In terms of draft language, TEMPLATE_SPAN may be either the TemplateHead or
		// TemplateMiddle productions, while TEMPLATE_TAIL is either TemplateTail, or
		// NoSubstitutionTemplate.
		//
		// When parsing a TemplateLiteral, we must have scanned either an initial
		// TEMPLATE_SPAN, or a TEMPLATE_TAIL.
		let next = this.peek();
		if (!Token.isTemplate(next.token)) {
			throw new SyntaxError(this.errorMessage(`Unexpected Token: ${JSON.stringify(this.next())}`));
		}
		// If we reach a TEMPLATE_TAIL first, we are parsing a NoSubstitutionTemplate.
		// In this case we may simply consume the token and build a template with a
		// single TEMPLATE_SPAN and no expressions.
		if (next.isType(Token.TEMPLATE_TAIL)) {
			this.consume(Token.TEMPLATE_TAIL);
			const string = next.getValue<TemplateStringLiteral>().string;
			return this.createTemplateLiteralExpressionNode([string], [], tag);
		}
		this.consume(Token.TEMPLATE_SPAN);
		const expressions: ExpressionNode[] = [];
		const strings: string[] = [];
		strings.push(next.getValue<TemplateStringLiteral>().string);
		// If we open with a TEMPLATE_SPAN, we must scan the subsequent expression,
		// and repeat if the following token is a TEMPLATE_SPAN as well (in this
		// case, representing a TemplateMiddle).
		do {
			this.setAcceptIN(true);
			const expression = this.parseExpressionCoverGrammar();
			expressions.push(expression);
			next = this.next();
			if (next.isNotType(Token.RBRACE)) {
				this.restoreAcceptIN();
				throw new SyntaxError(this.errorMessage('Unterminated Template Expr'));
			}
			// If we didn't die parsing that expression, our next token should be a
			// TEMPLATE_SPAN or TEMPLATE_TAIL.
			next = this.scanner.scanTemplateContinuation();
			strings.push(next.getValue<TemplateStringLiteral>().string);
			this.restoreAcceptIN();
		} while (next.isType(Token.TEMPLATE_SPAN));
		if (next.isNotType(Token.TEMPLATE_TAIL)) {
			throw new SyntaxError(this.errorMessage(`Unexpected Token: ${JSON.stringify(next)}`));
		}
		// Once we've reached a TEMPLATE_TAIL, we can close the TemplateLiteral.
		return this.createTemplateLiteralExpressionNode(strings, expressions, tag);
	}
	protected createTemplateLiteralExpressionNode(strings: string[], expressions: ExpressionNode[], tag?: ExpressionNode): TaggedTemplateExpression | TemplateLiteral {
		if (tag) {
			return new TaggedTemplateExpression(tag, strings, expressions);
		} else {
			return new TemplateLiteral(strings, expressions);
		}
	}
	protected parseMemberWithPresentNewPrefixesExpression(): ExpressionNode {
		// NewExpression ::
		//   ('new')+ MemberExpression
		//
		// NewTarget ::
		//   'new' '.' 'target'

		// The grammar for new expressions is pretty warped. We can have several 'new'
		// keywords following each other, and then a MemberExpression. When we see '('
		// after the MemberExpression, it's associated with the rightmost unassociated
		// 'new' to create a NewExpression with arguments. However, a NewExpression
		// can also occur without arguments.

		// Examples of new expression:
		// new foo.bar().baz means (new (foo.bar)()).baz
		// new foo()() means (new foo())()
		// new new foo()() means (new (new foo())())
		// new new foo means new (new foo)
		// new new foo() means new (new foo())
		// new new foo().bar().baz means (new (new foo()).bar()).baz
		// new super.x means new (super.x)
		this.consume(Token.NEW);

		let result: ExpressionNode;

		// CheckStackOverflow();

		if (this.peek().isType(Token.IMPORT) && this.peekAhead().isType(Token.LPAREN)) {
			throw new SyntaxError(this.errorMessage(`Import Call Not New Expression`));
		} else if (this.peek().isType(Token.PERIOD)) {
			result = this.parseNewTargetExpression();
			return this.parseMemberExpressionContinuation(result);
		} else {
			result = this.parseMemberExpression();
			if (result instanceof Super) {
				// new super() is never allowed
				throw new SyntaxError(this.errorMessage(`Unexpected Super, new super() is never allowed`));
			}
		}
		if (this.peek().isType(Token.LPAREN)) {
			// NewExpression with arguments.
			const args = this.parseArguments();
			result = new NewExpression(result, args);
			// The expression can still continue with . or [ after the arguments.
			return this.parseMemberExpressionContinuation(result);
		}

		if (this.peek().isType(Token.QUESTION_PERIOD)) {
			throw new SyntaxError(this.errorMessage(`Optional Chaining with New not allowed,  new x?.y()`));
		}
		return new NewExpression(result);
	}
	protected parseArguments(maybeArrow?: ParsingArrowHeadFlag): ExpressionNode[] {
		// Arguments ::
		//   '(' (AssignmentExpression)*[','] ')'

		this.consume(Token.LPAREN);
		const args: ExpressionNode[] = [];
		while (this.peek().isNotType(Token.RPAREN)) {
			const isSpread = this.check(Token.ELLIPSIS);
			this.setAcceptIN(true);
			let argument: ExpressionNode = this.parseAssignmentExpressionCoverGrammar();
			if (ParsingArrowHeadFlag.MaybeArrowHead === maybeArrow) {
				if (isSpread) {
					if (argument instanceof AssignmentExpression) {
						this.restoreAcceptIN();
						throw new Error(this.errorMessage(` Rest parameter may not have a default initializer'`));
					}
					if (this.peek().isType(Token.COMMA)) {
						this.restoreAcceptIN();
						throw new Error(this.errorMessage(`parsing '...spread,arg =>'`));
					}
				}
			}
			if (isSpread) {
				argument = new SpreadElement(argument);
			}
			args.push(argument);
			this.restoreAcceptIN();
			if (!this.check(Token.COMMA)) break;
		}
		if (!this.check(Token.RPAREN)) {
			throw new Error(this.errorMessage(`parsing arguments call, expecting ')'`));
		}
		return args;
	}
	protected parseAssignmentExpressionCoverGrammar(): ExpressionNode {
		// AssignmentExpression ::
		//   ConditionalExpression
		//   ArrowFunction
		//   YieldExpression
		//   LeftHandSideExpression AssignmentOperator AssignmentExpression

		if (this.peek().isType(Token.YIELD) && isGeneratorFunction(this.functionKind)) {
			return this.parseYieldExpression();
		}
		let expression: ExpressionNode = this.parseConditionalExpression();
		const op = this.peek().token;
		if (!Token.isArrowOrAssignmentOp(op)) {
			this.clearParenthesized(expression);
			return expression;
		};
		// Arrow functions.
		if (op === Token.ARROW) {
			if (!this.isIdentifier(expression) && !this.isParenthesized(expression)) {
				throw new Error(this.errorMessage(`Malformed Arrow Fun Param List`));
			}
			const kind = FunctionKind.NormalFunction;
			this.setFunctionKind(kind);
			let arrow: ExpressionNode;
			if (expression instanceof SequenceExpression) {
				const params = expression.getExpressions()
					.map(expr => new Param(expr as DeclarationExpression));
				arrow = this.parseArrowFunctionLiteral(params, FunctionKind.NormalFunction);
			} else if (expression instanceof GroupingExpression) {
				arrow = this.parseArrowFunctionLiteral([new Param(expression.getNode() as DeclarationExpression)], FunctionKind.NormalFunction);
			} else {
				this.clearParenthesized(expression);
				arrow = this.parseArrowFunctionLiteral([new Param(expression as DeclarationExpression)], FunctionKind.NormalFunction);
			}
			this.restoreFunctionKind();
			return arrow;
		}
		if (this.isAssignableIdentifier(expression)) {
		} else if (this.isProperty(expression)) {
		} else if (this.isPattern(expression) && Token.isAssignment(op)) {
			// Destructuring assignment.
			expression = expression instanceof ObjectExpression
				? new ObjectPattern(expression.getProperties())
				: new ArrayPattern(expression.getElements() as DeclarationExpression[]);
			// expression_scope() -> ValidateAsPattern(expression, lhs_beg_pos, end_position());
		} else {
			if (!this.isValidReferenceExpression(expression)) {
				throw new Error(this.errorMessage(`Invalid Reference Expression`));
			}
			if (Token.isLogicalAssignmentOp(op)) {
				throw new Error(this.errorMessage(`Invalid Lhs In Assignment`));
			}
		}

		this.consume(op);
		// const opPosition = this.position();
		const right: ExpressionNode = this.parseAssignmentExpression();
		// Anonymous function name inference applies to =, ||=, &&=, and ??=.

		if (!Token.isAssignment(op)) {
			throw new Error(this.errorMessage(`Invalid Destructuring Target`));
		}
		return new AssignmentExpression(op.getName() as AssignmentOperator, expression, right);
	}
	protected parseAssignmentExpression(): ExpressionNode {
		return this.parseAssignmentExpressionCoverGrammar();
	}
	private checkParamType(identifier: DeclarationExpression) {
		if (identifier instanceof ArrayExpression) {
			return new ArrayPattern(identifier.getElements() as DeclarationExpression[]);
		} else if (identifier instanceof ObjectExpression) {
			return new ObjectPattern(identifier.getProperties());
		}
		else if (identifier instanceof SpreadElement) {
			let arg = identifier.getArgument() as DeclarationExpression;
			// let param = arg;
			if (arg instanceof ArrayExpression) {
				arg = new ArrayPattern(arg.getElements() as DeclarationExpression[]);
			} else if (arg instanceof ObjectExpression) {
				arg = new ObjectPattern(arg.getProperties());
			}
			return new RestElement(arg);
		}
		return identifier;
	}
	private mapParams(parameters: Param[]) {
		return parameters.map(param => new Param(
			this.checkParamType(param.getIdentifier()),
			param.getDefaultValue()
		));
	}
	protected parseArrowFunctionLiteral(parameters: Param[], kind: FunctionKind): ExpressionNode {
		parameters = this.mapParams(parameters);
		if (this.peek().isNotType(Token.ARROW)) {
			throw new SyntaxError(this.errorMessage('SyntaxError Expecting Arrow Token'));
		}
		if (this.scanner.hasLineTerminatorBeforeNext()) {
			throw new SyntaxError(this.errorMessage('Unexpected Token "\n" a line terminator after arrow token"'));
		}
		let body: ExpressionNode[] | ExpressionNode;
		let has_braces = true;
		this.consume(Token.ARROW);
		if (this.peek().isType(Token.LBRACE)) {
			this.consume(Token.LBRACE);
			this.setStatue(true, kind);
			body = this.parseFunctionBody(kind, FunctionBodyType.BLOCK, FunctionSyntaxKind.AnonymousExpression);
			this.restoreStatue();
		} else {
			has_braces = false;
			body = this.parseFunctionBody(kind, FunctionBodyType.EXPRESSION, FunctionSyntaxKind.AnonymousExpression);
		}
		return new ArrowFunctionExpression(parameters, body, !has_braces, isAsyncFunction(kind));
	}
	protected parseRegExpLiteral(): ExpressionNode {
		if (!this.scanner.scanRegExpPattern()) {
			throw new Error('Unterminated RegExp');
		}
		return this.scanner.currentToken().getValue();
	}
	protected parseArrayLiteral(isPattern: boolean) {

		// ArrayLiteral ::
		//   '[' Expression? (',' Expression?)* ']'

		this.consume(Token.LBRACK);
		let first_spread_index = -1;
		const values: (ExpressionNode | null)[] = [];

		while (!this.check(Token.RBRACK)) {
			let elem: ExpressionNode | null;
			if (this.peek().isType(Token.COMMA)) {
				elem = null;
			} else if (this.check(Token.ELLIPSIS)) {
				this.setAcceptIN(true);
				const argument = this.parsePossibleDestructuringSubPattern();
				this.restoreAcceptIN();
				elem = new SpreadElement(argument);
				if (first_spread_index < 0) {
					first_spread_index = values.length;
				}
				if (argument instanceof AssignmentExpression && isPattern) {
					throw new SyntaxError(this.errorMessage('Invalid Destructuring Target'));
				}
				if (this.peek().isType(Token.COMMA)) {
					throw new SyntaxError(this.errorMessage('Element After Rest'));
				}
			} else {
				this.setAcceptIN(true);
				elem = this.parsePossibleDestructuringSubPattern();
				this.restoreAcceptIN();
			}
			values.push(elem);
			if (this.peek().isNotType(Token.RBRACK)) {
				this.expect(Token.COMMA);
			}
		}
		return new (isPattern ? ArrayPattern : ArrayExpression)(values as DeclarationExpression[]);
	}
	protected parsePossibleDestructuringSubPattern(): ExpressionNode {
		return this.parseAssignmentExpressionCoverGrammar();
	}
	protected parseObjectLiteral(isPattern: boolean): ExpressionNode {
		// ObjectLiteral ::
		// '{' (PropertyDefinition (',' PropertyDefinition)* ','? )? '}'

		this.consume(Token.LBRACE);
		const properties: ExpressionNode[] = [];
		while (!this.check(Token.RBRACE)) {
			const property: ExpressionNode = this.parseObjectPropertyDefinition(isPattern);
			properties.push(property);
			if (this.peek().isNotType(Token.RBRACE)) {
				this.expect(Token.COMMA);
			}
		}
		if (isPattern) {
			return new ObjectPattern(properties as (Property | RestElement)[]);
		}
		return new ObjectExpression(properties as Property[]);
	}
	protected parseObjectPropertyDefinition(isPattern: boolean): ExpressionNode {
		const propInfo = new PropertyKindInfo();
		const nameExpression = this.parseProperty(propInfo);

		switch (propInfo.kind) {
			case PropertyKind.Spread:
				let value: SpreadElement | RestElement = nameExpression as SpreadElement;
				if (isPattern) {
					value = new RestElement(value.getArgument() as DeclarationExpression);
				}
				return new Property(
					value.getArgument(),
					value,
					'init',
					false,
					false,
					propInfo.isComputedName
				);

			case PropertyKind.Value: {
				this.consume(Token.COLON);
				this.setAcceptIN(true);
				const value = this.parsePossibleDestructuringSubPattern();
				this.restoreAcceptIN();
				return new Property(
					nameExpression,
					value,
					'init',
					false,
					false,
					propInfo.isComputedName
				);
			}

			case PropertyKind.Assign:
			case PropertyKind.ShorthandOrClassField:
			case PropertyKind.Shorthand: {
				// PropertyDefinition
				//    IdentifierReference
				//    CoverInitializedName
				//
				// CoverInitializedName
				//    IdentifierReference Initializer?

				const lhs = new Identifier(propInfo.name);
				if (!this.isAssignableIdentifier(lhs)) {
					throw new Error(this.errorMessage('Strict Eval Arguments'));
				}
				let value: ExpressionNode;
				if (this.peek().isType(Token.ASSIGN)) {
					this.consume(Token.ASSIGN);
					this.setAcceptIN(true);
					const rhs = this.parseAssignmentExpression();
					this.restoreAcceptIN();
					value = new AssignmentExpression(Token.ASSIGN.getName() as AssignmentOperator, lhs, rhs);
				} else {
					value = lhs;
				}
				return new Property(
					nameExpression,
					value,
					'init',
					false,
					propInfo.kind !== PropertyKind.Assign,
					propInfo.isComputedName
				);
			}

			case PropertyKind.Method: {
				// MethodDefinition
				//    PropertyName '(' StrictFormalParameters ')' '{' FunctionBody '}'
				//    '*' PropertyName '(' StrictFormalParameters ')' '{' FunctionBody '}'

				const kind = this.methodKindFor(propInfo.isStatic, propInfo.funcFlag);
				const value = this.parseFunctionLiteral(
					kind,
					FunctionSyntaxKind.AccessorOrMethod,
					propInfo.name ? new Identifier(propInfo.name) : undefined
				);
				return new Property(
					nameExpression,
					value,
					'init',
					true,
					false,
					propInfo.isComputedName
				);
			}

			case PropertyKind.AccessorGetter:
			case PropertyKind.AccessorSetter: {
				const isGet = propInfo.kind == PropertyKind.AccessorGetter;
				const kind = this.methodKindFor(propInfo.isStatic, propInfo.funcFlag);
				const value = this.parseFunctionLiteral(
					kind,
					FunctionSyntaxKind.AccessorOrMethod,
					propInfo.name ? new Identifier(propInfo.name) : undefined
				);
				return new Property(
					nameExpression,
					value,
					isGet ? 'get' : 'set',
					false,
					false,
					propInfo.isComputedName
				);
			}

			case PropertyKind.ClassField:
			case PropertyKind.NotSet:
				return new Literal<null>(null);
		}
	}
	protected parseProperty(propInfo: PropertyKindInfo): ExpressionNode {
		let nextToken = this.peek();
		if (this.check(Token.ASYNC)) {
			// async
			nextToken = this.peek();
			if (nextToken.isNotType(Token.MUL)
				&& propInfo.parsePropertyKindFromToken(nextToken.token)
				|| this.scanner.hasLineTerminatorBeforeNext()) {
				return new Identifier('async');
			}
			propInfo.kind = PropertyKind.Method;
			propInfo.funcFlag = ParseFunctionFlag.IsAsync;
		}

		if (this.check(Token.MUL)) {
			// async*
			propInfo.kind = PropertyKind.Method;
			propInfo.funcFlag = ParseFunctionFlag.IsGenerator;
		}

		nextToken = this.peek();
		if (propInfo.kind == PropertyKind.NotSet && nextToken.isType(Token.GET) || nextToken.isType(Token.SET)) {
			const token = this.next();
			if (propInfo.parsePropertyKindFromToken(this.peek().token)) {
				return new Identifier(nextToken.isType(Token.GET) ? 'get' : 'set');
			}
			if (token.isType(Token.GET)) {
				propInfo.kind = PropertyKind.AccessorGetter;
			} else if (token.isType(Token.SET)) {
				propInfo.kind = PropertyKind.AccessorSetter;
			}
			nextToken = this.peek();
		}
		let propertyName: ExpressionNode;
		switch (nextToken.token) {
			case Token.PRIVATE_NAME:
				propInfo.isPrivate = true;
				this.consume(Token.PRIVATE_NAME);
				if (propInfo.kind == PropertyKind.NotSet) {
					propInfo.parsePropertyKindFromToken(this.peek().token);
				}
				propertyName = this.getIdentifier();
				propInfo.name = (propertyName as PrivateIdentifier).getName() as string;
				if (propInfo.position == PropertyPosition.ObjectLiteral) {
					throw new TypeError(this.errorMessage('UnexpectedToken PRIVATE_NAME'));
				}
				break;
			case Token.STRING:
			case Token.NUMBER:
			case Token.BIGINT:
				//   "12" -> 12
				//   12.3 -> "12.3"
				//   12.30 -> "12.3"
				this.consume(nextToken.token);
				propertyName = nextToken.getValue();
				propInfo.name = (propertyName as Literal<string>).getValue();
				break;
			case Token.LBRACK:
				// [Symbol.iterator]
				this.consume(Token.LBRACK);
				this.setAcceptIN(true);
				propertyName = this.parseAssignmentExpression();
				this.expect(Token.RBRACK);
				if (propInfo.kind === PropertyKind.NotSet) {
					propInfo.parsePropertyKindFromToken(this.peek().token);
				}
				propInfo.name = propertyName.toString();
				this.restoreAcceptIN();
				return propertyName;
			case Token.ELLIPSIS:
				if (propInfo.kind == PropertyKind.NotSet) {
					this.consume(Token.ELLIPSIS);
					this.setAcceptIN(true);
					propertyName = this.parsePossibleDestructuringSubPattern();
					propInfo.kind = PropertyKind.Spread;

					if (!this.isValidReferenceExpression(propertyName)) {
						throw new Error(this.errorMessage('Invalid Rest Binding/Assignment Pattern'));
					}
					if (this.peek().isNotType(Token.RBRACE)) {
						throw new Error(this.errorMessage('Element After Rest'));
					}
					propInfo.name = propertyName.toString();
					this.restoreAcceptIN();
					return new SpreadElement(propertyName);
				}
			default:
				propertyName = this.parsePropertyOrPrivatePropertyName();
				propInfo.name = propertyName.toString();
				break;
		}
		if (propInfo.kind === PropertyKind.NotSet) {
			propInfo.parsePropertyKindFromToken(this.peek().token);
		}
		return propertyName;
	}
	protected parseMemberExpressionContinuation(expression: ExpressionNode): ExpressionNode {
		if (!Token.isMember(this.peek().token)) return expression;
		return this.doParseMemberExpressionContinuation(expression);
	}
	protected doParseMemberExpressionContinuation(expression: ExpressionNode): ExpressionNode {
		if (!Token.isMember(this.peek().token)) {
			throw new Error(this.errorMessage(`Parsing member expression`));
		}
		// Parses this part of MemberExpression:
		// ('[' Expression ']' | '.' Identifier | TemplateLiteral)*
		do {
			switch (this.peek().token) {
				case Token.LBRACK: {
					this.consume(Token.LBRACK);
					this.setAcceptIN(true);
					const index = this.parseExpressionCoverGrammar();
					expression = new MemberExpression(expression, index, true);
					this.expect(Token.RBRACK);
					this.restoreAcceptIN();
					break;
				}
				case Token.PERIOD: {
					this.consume(Token.PERIOD);
					const key: ExpressionNode = this.parsePropertyOrPrivatePropertyName();
					expression = new MemberExpression(expression, key, false);
					break;
				}
				case Token.TEMPLATE_SPAN:
				case Token.TEMPLATE_TAIL: {
					expression = this.parseTemplateLiteral(expression);
					break;
				}
				default:
					throw new SyntaxError(this.errorMessage('unknown token position'));
			}
		} while (Token.isMember(this.peek().token));
		return expression;
	}
	protected parsePropertyOrPrivatePropertyName(): ExpressionNode {
		const next = this.next();
		if (next.isType(Token.IDENTIFIER) || next.isType(Token.PRIVATE_NAME)) {
			return next.getValue();
		}
		// check keyword as identifier
		if (Token.isPropertyName(next.token) && next.isNotType(Token.EOS)) {
			return new Identifier(next.token.getName());
		}
		throw new SyntaxError(this.errorMessage(`Parsing property expression: Unexpected Token`));
	}
	protected parsePipelineExpression(expression: ExpressionNode): ExpressionNode {
		// ConditionalExpression ::
		//   LogicalExpression
		//   expression '|>' function [':' expression [':'? expression] ] *
		//   expression '|>' function '('[expression ','?]* ')'
		//
		//   expression '|>' function ':' expression [':' expression | '?']*]
		//   expression '|>' function '(' expression [',' expression | '?']* ')'
		//
		// [~Await]PipelineExpression[?In, ?Yield, ?Await] |> LogicalORExpression[?In, ?Yield, ?Await]
		// [+Await]PipelineExpression[? In, ? Yield, ? Await] |> [lookahead ∉ { await }]LogicalORExpression[? In, ? Yield, ? Await]

		let token: Token;
		while (Token.isPipelineOperator(token = this.peek().token)) {
			this.consume(token);
			expression = this.parsePipelineBody(expression);
		}
		return expression;
	}
	protected parsePipelineBody(lhs: ExpressionNode): ExpressionNode {
		let body: ExpressionNode | undefined;
		let token = this.peek();
		// parse function
		switch (token.token) {
			case Token.FUNCTION:
				body = this.parseFunctionExpression();
				break;
			case Token.ASYNC:
				if (this.peekAhead().isType(Token.FUNCTION) && !this.scanner.hasLineTerminatorAfterNext()) {
					this.consume(Token.ASYNC);
					body = this.parseAsyncFunctionLiteral();
				}
				break;
			default:
				break;
		}
		if (body) {
			return new PipelineExpression(lhs, body);
		}
		if (token.isType(Token.LPAREN)) {
			// parse arrow function
			// x |> ( y => y+1 )
			body = this.parsePrimaryExpression();
			return new PipelineExpression(lhs, body);
		}

		// parse angular-like and f# and partial operator syntax
		const func = this.parseMemberExpression(); //this.parseLogicalExpression();
		let args: (ExpressionNode | '?' | '...?')[] = [];
		switch (this.peek().token) {
			case Token.COLON:
				// support angular pipeline syntax
				do {
					this.consume(Token.COLON);
					const isSpread = this.check(Token.ELLIPSIS);
					if (this.peek().isType(Token.CONDITIONAL)) {
						this.consume(Token.CONDITIONAL);
						if (isSpread) {
							args.push('...?');
						} else {
							args.push('?');
						}
					} else {
						const arg = this.parseAssignmentExpressionCoverGrammar();
						if (isSpread) {
							args.push(new SpreadElement(arg));
						} else {
							args.push(arg);
						}
					}
				} while (this.peek().isType(Token.COLON));
				break;
			case Token.LPAREN:
				// es2022 syntax, F# & partial operator
				this.consume(Token.LPAREN);
				let indexed = false;
				while (this.peek().isNotType(Token.RPAREN)) {
					const isSpread = this.check(Token.ELLIPSIS);
					if (this.peek().isType(Token.CONDITIONAL)) {
						this.consume(Token.CONDITIONAL);
						indexed = true;
						if (isSpread) {
							args.push('...?');
						} else {
							args.push('?');
						}
					} else {
						const arg = this.parseAssignmentExpressionCoverGrammar();
						if (isSpread) {
							args.push(new SpreadElement(arg));
						} else {
							args.push(arg);
						}
					}
					this.check(Token.COMMA);
				}
				this.expect(Token.RPAREN);
				// should be indexed, has partial operator
				if (!indexed) {
					// z |> method(x, y) === method(x, y)(z)
					body = new CallExpression(func, args as ExpressionNode[]);
					return new PipelineExpression(lhs, body);
				}
				break;
			default:
				break;
		}
		return new PipelineExpression(lhs, func, args);
	}
	protected parseConditionalExpression(): ExpressionNode {
		// ConditionalExpression ::
		//   LogicalExpression
		//   LogicalExpression '?' AssignmentExpression ':' AssignmentExpression
		//

		let expression: ExpressionNode = this.parseLogicalExpression();
		expression = this.parsePipelineExpression(expression);
		return this.peek().isType(Token.CONDITIONAL) ? this.parseConditionalContinuation(expression) : expression;
	}
	protected parseLogicalExpression(): ExpressionNode {
		// LogicalExpression ::
		//   LogicalORExpression
		//   CoalesceExpression

		// Both LogicalORExpression and CoalesceExpression start with BitwiseOR.
		// Parse for binary expressions >= 6 (BitwiseOR);

		let expression: ExpressionNode = this.parseBinaryExpression(6);
		const peek = this.peek();
		if (peek.isType(Token.AND) || peek.isType(Token.OR)) {
			// LogicalORExpression, pickup parsing where we left off.
			const precedence = Token.precedence(peek.token, this.acceptIN);
			expression = this.parseBinaryContinuation(expression, 4, precedence);
		} else if (peek.isType(Token.NULLISH)) {
			expression = this.parseNullishExpression(expression);
		}
		return expression;
	}
	protected parseBinaryContinuation(x: ExpressionNode, prec: number, prec1: number): ExpressionNode {
		do {
			// prec1 >= 4
			while (Token.precedence(this.peek().token, this.acceptIN) === prec1) {
				let y: ExpressionNode;
				let op = this.next();

				const is_right_associative = op.isType(Token.EXP);
				const next_prec = is_right_associative ? prec1 : prec1 + 1;
				y = this.parseBinaryExpression(next_prec);


				// For now we distinguish between comparisons and other binary
				// operations.  (We could combine the two and get rid of this
				// code and AST node eventually.)

				if (Token.isCompare(op.token)) {
					// We have a comparison.
					let cmp = op.token;
					switch (op.token) {
						case Token.NE: cmp = Token.EQ; break;
						case Token.NE_STRICT: cmp = Token.EQ_STRICT; break;
						default: break;
					}
					x = shortcutNumericLiteralBinaryExpression(x, y, cmp);
					if (op.isNotType(cmp)) {
						// The comparison was negated - add a NOT.
						x = buildUnaryExpression(x, Token.NOT);
					}
				} else {
					x = shortcutNumericLiteralBinaryExpression(x, y, op.token);
				}
			}
			--prec1;
		} while (prec1 >= prec);

		return x;
	}
	// Precedence >= 4
	protected parseBinaryExpression(precedence: number): ExpressionNode {
		// "#foo in ShiftExpression" needs to be parsed separately, since private
		// identifiers are not valid PrimaryExpressions.
		if (this.peek().isType(Token.PRIVATE_NAME)) {
			const x = this.parsePropertyOrPrivatePropertyName();
			const precedence1 = Token.precedence(this.peek().token, this.acceptIN);
			if (this.peek().isNotType(Token.IN) || precedence1 < precedence) {
				throw new SyntaxError(this.errorMessage('Unexpected Token Token.PRIVATE_NAME "#name"'));
			}
			return this.parseBinaryContinuation(x, precedence, precedence1);
		}
		const x: ExpressionNode = this.parseUnaryExpression();
		const precedence1 = Token.precedence(this.peek().token, this.acceptIN);
		if (precedence1 >= precedence) {
			return this.parseBinaryContinuation(x, precedence, precedence1);
		}
		return x;
	}
	protected parseUnaryExpression(): ExpressionNode {
		// UnaryExpression ::
		//   PostfixExpression
		//   'delete' UnaryExpression
		//   'void' UnaryExpression
		//   'typeof' UnaryExpression
		//   '++' UnaryExpression
		//   '--' UnaryExpression
		//   '+' UnaryExpression
		//   '-' UnaryExpression
		//   '~' UnaryExpression
		//   '!' UnaryExpression
		//   [+Await] AwaitExpression[?Yield]

		const op = this.peek();
		if (Token.isUnaryOrCount(op.token)) {
			return this.parseUnaryOrPrefixExpression();
		}
		if (op.isType(Token.AWAIT) && this.isAwaitAllowed()) {
			return this.parseAwaitExpression();
		}
		return this.parsePostfixExpression();
	}
	protected parseUnaryOrPrefixExpression(): ExpressionNode {
		const op = this.next();
		const expression = this.parseUnaryExpression();
		if (Token.isUnary(op.token)) {
			if (op.isType(Token.DELETE)) {
				if (this.isIdentifier(expression) && isStrict(this.languageMode)) {
					// "delete identifier" is a syntax error in strict mode.
					throw new Error(this.errorMessage(`"delete identifier" is a syntax error in strict mode`));
				}
				if (expression instanceof MemberExpression && expression.getProperty().toString().startsWith('#')) {
					throw new Error(this.errorMessage(`"Delete Private Field" is a syntax error`));
				}
			}

			if (this.peek().isType(Token.EXP)) {
				throw new Error(this.errorMessage(`Unexpected Token Unary Exponentiation`));
			}
		}

		if (Token.isCount(op.token) || Token.isUnary(op.token)) {
			// Allow the parser to rewrite the expression.
			return buildUnaryExpression(expression, op.token);
		}
		throw new Error(this.errorMessage(`while rewrite unary operation`));
	}
	protected parsePostfixExpression(): ExpressionNode {
		// PostfixExpression ::
		//   LeftHandSideExpression ('++' | '--')?

		const expression: ExpressionNode = this.parseLeftHandSideExpression();
		if (!Token.isCount(this.peek().token) || this.scanner.hasLineTerminatorBeforeNext()) {
			return expression;
		}
		return this.parsePostfixContinuation(expression);
	}
	protected parsePostfixContinuation(expression: ExpressionNode): ExpressionNode {
		if (!this.isValidReferenceExpression(expression)) {
			throw new Error(this.errorMessage(`Invalid LHS In Postfix Op.`));
		}
		const op = this.next();
		return buildPostfixExpression(expression, op.token);
	}
	protected parseLeftHandSideExpression(): ExpressionNode {
		// LeftHandSideExpression ::
		//   (NewExpression | MemberExpression) ...
		const result = this.parseMemberExpression();
		if (!Token.isPropertyOrCall(this.peek().token)) return result;
		return this.parseLeftHandSideContinuation(result);
	}
	protected parseLeftHandSideContinuation(result: ExpressionNode): ExpressionNode {
		if (this.peek().isType(Token.LPAREN)
			&& this.isIdentifier(result)
			&& this.scanner.currentToken().isType(Token.ASYNC)
			&& !this.scanner.hasLineTerminatorBeforeNext()) {
			const args = this.parseArguments(ParsingArrowHeadFlag.AsyncArrowFunction);
			if (this.peek().isType(Token.ARROW)) {
				// async () => ...
				if (!args.length) return new EmptyStatement;
				// async ( Arguments ) => ...
				return this.expressionListToExpression(args);
			}
			result = new CallExpression(result, args);
			if (!Token.isPropertyOrCall(this.peek().token)) return result;
		}

		let optionalChaining = false;
		let isOptional = false;
		do {
			switch (this.peek().token) {
				// chain
				case Token.QUESTION_PERIOD: {
					if (isOptional) {
						throw new Error(this.errorMessage(`Failure Expression`));
					}
					this.consume(Token.QUESTION_PERIOD);
					isOptional = true;
					optionalChaining = true;
					if (Token.isPropertyOrCall(this.peek().token)) continue;
					const key = this.parsePropertyOrPrivatePropertyName();
					result = new MemberExpression(result, key, false, isOptional);
					break;
				}

				/* Property */
				case Token.LBRACK: {
					this.consume(Token.LBRACK);
					this.setAcceptIN(true);
					const index = this.parseExpressionCoverGrammar();
					this.restoreAcceptIN();
					result = new MemberExpression(result, index, true, isOptional);
					this.expect(Token.RBRACK);
					break;
				}

				/* Property */
				case Token.PERIOD: {
					if (isOptional) {
						throw new Error(this.errorMessage(`Unexpected Token:${this.position()}`));
					}
					this.consume(Token.PERIOD);
					const key = this.parsePropertyOrPrivatePropertyName();
					result = new MemberExpression(result, key, false, isOptional);
					break;
				}

				/* Call */
				case Token.LPAREN: {
					const args = this.parseArguments();
					result = new CallExpression(result, args, isOptional);
					break;
				}

				/* bind call */
				case Token.BIND: {
					if (isOptional) {
						throw new Error(this.errorMessage(`Unexpected Token:${this.position()}`));
					}
					this.consume(Token.BIND);
					const key = this.parsePropertyOrPrivatePropertyName();
					result = new BindExpression(result, key, false, isOptional);
					break;
				}

				/* chain bind call */
				case Token.QUESTION_BIND: {
					if (isOptional) {
						throw new Error(this.errorMessage(`Failure Expression`));
					}
					this.consume(Token.QUESTION_BIND);
					isOptional = true;
					optionalChaining = true;
					const key = this.parsePropertyOrPrivatePropertyName();
					result = new BindExpression(result, key, true, isOptional);
					break;
				}

				default:
					// Template literals in/after an Optional Chain not supported:
					if (optionalChaining) {
						throw new Error(this.errorMessage(`Optional Chaining No Template support`));
					}
					/* Tagged Template */
					result = this.parseTemplateLiteral(result);
					break;
			}
			if (isOptional) {
				isOptional = false;
			}
		} while (Token.isPropertyOrCall(this.peek().token));
		if (optionalChaining) {
			result = new ChainExpression(result);
		}
		return result;
	}
	protected parseAwaitExpression(): ExpressionNode {
		this.consume(Token.AWAIT);
		const value = this.parseUnaryExpression();
		if (this.peek().isType(Token.EXP)) {
			throw new Error(this.scanner.createError(`Unexpected Token Unary Exponentiation`));
		}
		return buildUnaryExpression(value, Token.AWAIT);
	}
	protected parseNullishExpression(expression: ExpressionNode): ExpressionNode {
		// CoalesceExpression ::
		//   CoalesceExpressionHead ?? BitwiseORExpression
		//
		//   CoalesceExpressionHead ::
		//     CoalesceExpression
		//     BitwiseORExpression

		// We create a binary operation for the first nullish, otherwise collapse
		// into an nary expression.

		const list: ExpressionNode[] = [];
		list.push(expression);
		while (this.peek().isType(Token.NULLISH)) {
			this.consume(Token.NULLISH);
			// Parse BitwiseOR or higher.
			expression = this.parseBinaryExpression(6);
			list.push(expression);
		}
		expression = list.pop()!;
		expression = list.reverse()
			.reduce((previous, current) => new LogicalExpression(Token.NULLISH.getName() as LogicalOperator, current, previous), expression);
		return expression;
	}
	protected parseConditionalContinuation(expression: ExpressionNode): ExpressionNode {
		this.consume(Token.CONDITIONAL);
		this.setAcceptIN(true);
		const left: ExpressionNode = this.parseAssignmentExpression();
		this.restoreAcceptIN();
		this.expect(Token.COLON);
		const right = this.parseAssignmentExpression();
		return new ConditionalExpression(expression, left, right);
	}
	protected parseYieldExpression(): ExpressionNode {
		// YieldExpression ::
		//   'yield' ([no line terminator] '*'? AssignmentExpression)?
		this.consume(Token.YIELD);
		let delegating = false;  // yield*
		let expression: ExpressionNode | undefined;
		if (!this.scanner.hasLineTerminatorBeforeNext()) {
			if (this.check(Token.MUL)) {
				delegating = true;
			}
			switch (this.peek().token) {
				case Token.EOS:
				case Token.SEMICOLON:
				case Token.RBRACE:
				case Token.RBRACK:
				case Token.RPAREN:
				case Token.COLON:
				case Token.COMMA:
				case Token.IN:
					// The above set of tokens is the complete set of tokens that can appear
					// after an AssignmentExpression, and none of them can start an
					// AssignmentExpression.  This allows us to avoid looking for an RHS for
					// a regular yield, given only one look-ahead token.
					if (!delegating) break;
					// Delegating yields require an RHS; fall through.
					// V8_FALLTHROUGH;
					throw new Error(this.errorMessage(`Delegating yields require an RHS`));
				default:
					expression = this.parseAssignmentExpressionCoverGrammar();
					break;
			}
		}
		return new YieldExpression(delegating, expression);
	}
	protected parseNewTargetExpression(): ExpressionNode {
		throw new Error(this.errorMessage('Expression (new.target) not supported.'));
	}
	protected parseClassExpression(): ClassExpression {
		throw new Error(this.errorMessage(`Expression (class) not supported.`));
	}
	protected parseClassDeclaration(names: string[] | undefined, defaultExport: boolean): ClassDeclaration {
		throw new Error(this.errorMessage(`Expression (class) not supported.`));
	}
	protected parseClassLiteral(name: ExpressionNode | undefined, isStrictReserved: boolean): ExpressionNode {
		throw new Error(this.errorMessage(`Expression (class) not supported.`));
	}
	protected parseSuperExpression(): ExpressionNode {
		throw new Error(this.errorMessage('Expression (supper) not supported.'));
	}
	protected parseImportExpressions(): ExpressionNode {
		throw new Error(this.errorMessage('Expression (import) not supported.'));
	}
}
