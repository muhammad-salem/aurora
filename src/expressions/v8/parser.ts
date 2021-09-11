import type { DeclareExpression, ExpressionNode } from '../api/expression.js';
import { Token, TokenExpression } from './token.js';
import { PreTemplateLiteral, TokenStream } from './stream.js';
import {
	OfNode, Identifier, ThisNode,
	GetIdentifier, SetIdentifier, AsyncIdentifier,
	NullNode, StringLiteral, AwaitIdentifier,
	ConstructorIdentifier, NameIdentifier,
	EvalIdentifier, ArgumentsIdentifier, TaggedTemplateExpression, TemplateLiteral
} from '../api/definition/values.js';
import { EmptyStatement } from '../api/statement/control/empty.js';
import { BlockStatement } from '../api/statement/control/block.js';
import {
	ArrowFunctionExpression, ArrowFunctionType,
	FunctionKind, Param, FunctionExpression
} from '../api/definition/function.js';
import { IfStatement } from '../api/statement/control/if.js';
import { NewExpression } from '../api/computing/new.js';
import { SpreadElement } from '../api/computing/spread.js';
import { RestElement } from '../api/computing/rest.js';
import { AssignmentExpression, AssignmentOperator } from '../api/operators/assignment.js';
import { GroupingExpression } from '../api/operators/grouping.js';
import { MemberExpression } from '../api/definition/member.js';
import { BindExpression, ChainBindExpression } from '../api/definition/bind.js';
import { ObjectExpression, Property, ObjectPattern } from '../api/definition/object.js';
import { ArrayExpression, ArrayPattern } from '../api/definition/array.js';
import { CallExpression } from '../api/computing/call.js';
import { DoWhileNode, WhileNode } from '../api/statement/iterations/while.js';
import { CatchClauseNode, ThrowStatement, TryCatchNode } from '../api/computing/throw.js';
import { SwitchCase, DefaultExpression, SwitchStatement } from '../api/statement/control/switch.js';
import { BreakStatement, ContinueStatement } from '../api/statement/control/terminate.js';
import { ReturnStatement } from '../api/computing/return.js';
import { VariableNode, VariableDeclarationNode } from '../api/statement/declarations/declares.js';
import { ForNode, ForOfNode, ForInNode, ForAwaitOfNode, ForDeclaration } from '../api/statement/iterations/for.js';
import { ConditionalExpression } from '../api/operators/ternary.js';
import { PipelineExpression } from '../api/operators/pipeline.js';
import { LogicalExpression, LogicalOperator } from '../api/operators/logical.js';
import { SequenceExpression } from '../api/operators/comma.js';
import { ChainExpression } from '../api/operators/chaining.js';
import { ExpressionStatement } from '../api/definition/statement.js';
import {
	buildPostfixExpression, buildUnaryExpression,
	expressionFromLiteral, shortcutNumericLiteralBinaryExpression
} from './nodes.js';
import { BinaryExpression } from '../api/operators/binary.js';

export enum ParsingArrowHeadFlag { CertainlyNotArrowHead, MaybeArrowHead, AsyncArrowFunction }
export enum PropertyKind {
	Value, Shorthand, ShorthandOrClassField,
	Assign, Method, ClassField, AccessorGetter, AccessorSetter,
	Spread, NotSet
}
export type PropertyKindInfo = { kind?: PropertyKind, funcFlag?: FunctionKind, name: string };
export type FunctionInfo = { rest?: boolean };
export function parsePropertyKindFromToken(token: Token, info: PropertyKindInfo) {
	switch (token) {
		case Token.COLON:
			info.kind = PropertyKind.Value;
			return true;
		case Token.COMMA:
			info.kind = PropertyKind.Shorthand;
			return true;
		case Token.R_CURLY:
			info.kind = PropertyKind.ShorthandOrClassField;
			return true;
		case Token.ASSIGN:
			info.kind = PropertyKind.Assign;
			return true;
		case Token.L_PARENTHESES:
			info.kind = PropertyKind.Method;
			return true;
		case Token.MUL:
		case Token.SEMICOLON:
			info.kind = PropertyKind.ClassField;
			return true;
		default:
			break;
	}
	return false;
}

export enum PreParserIdentifierType {
	NullIdentifier = 'NullIdentifier',
	UnknownIdentifier = 'UnknownIdentifier',
	EvalIdentifier = 'EvalIdentifier',
	ArgumentsIdentifier = 'ArgumentsIdentifier',
	ConstructorIdentifier = 'ConstructorIdentifier',
	AwaitIdentifier = 'AwaitIdentifier',
	AsyncIdentifier = 'AsyncIdentifier',
	NameIdentifier = 'NameIdentifier',
	PrivateNameIdentifier = 'PrivateNameIdentifier'
}

export abstract class AbstractParser {
	constructor(protected scanner: TokenStream) { }
	abstract scan(): ExpressionNode;
	protected position() {
		return this.scanner.getPos();
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
		if (this.scanner.next().isNotType(token)) {
			throw new Error(this.errorMessage(`Parsing ${JSON.stringify(token)}`));
		}
	}
	protected check(token: Token): boolean {
		const next = this.scanner.peek();
		if (next.isType(token)) {
			this.scanner.next();
			return true;
		}
		return false;
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
	}
	protected checkInOrOf(): 'IN' | 'OF' | false {
		if (this.check(Token.IN)) {
			return 'IN';
		} else if (this.checkValue(OfNode)) {
			return 'OF';
		}
		return false;
	}
	protected peekInOrOf(): 'IN' | 'OF' | false {
		var next = this.peek();
		if (next.isType(Token.IN)) {
			return 'IN';
		} else if (next.value === OfNode) {
			return 'OF';
		}
		return false;
	}
	protected isEvalOrArguments(name: ExpressionNode): boolean {
		if (name.toString() === 'eval') {
			return true;
		} else if (name.toString() === 'arguments') {
			return true;
		}
		return false;
	}
	protected isNextLetKeyword() {
		if (this.peek().isNotType(Token.LET)) {
			return false;
		}
		const nextNextToken = this.peekAhead().token;
		switch (nextNextToken) {
			case Token.L_CURLY:
			case Token.L_BRACKETS:
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
	protected isParenthesized(expression: ExpressionNode): expression is (GroupingExpression | SequenceExpression) {
		return expression instanceof GroupingExpression || expression instanceof SequenceExpression;
	}
	protected isAssignableIdentifier(expression: ExpressionNode): boolean {
		// return expression instanceof AssignmentNode;
		if (!(expression instanceof Identifier)) {
			return false;
		}
		if (this.isEvalOrArguments(expression)) {
			return false;
		}
		return true;
	}
	protected isPattern(expression: ExpressionNode): expression is (ObjectPattern | ArrayPattern) {
		return expression instanceof ObjectPattern || expression instanceof ArrayPattern;
	}
	protected isProperty(expression: ExpressionNode): expression is MemberExpression {
		return expression instanceof MemberExpression;
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
	protected isThisProperty(expression: ExpressionNode): boolean {
		if (this.isProperty(expression)) {
			if (expression.getObject() === ThisNode || expression.getObject().toString() === 'this') {
				return true;
			}
		}
		return false;
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
		if (this.scanner.currentToken().isType(Token.AWAIT)) {
			throw new Error(this.errorMessage(`Await Not In Async Context/Function`));
		}
	}
	protected peekAnyIdentifier() {
		return Token.isAnyIdentifier(this.peek().token);
	}
	protected errorMessage(message: string): string {
		return this.scanner.createError(message);
	}
}

export class JavaScriptParser extends AbstractParser {
	static parse(app: string) {
		const stream = TokenStream.getTokenStream(app);
		const parser = new JavaScriptParser(stream);
		return parser.scan();
	}
	scan(): ExpressionNode {
		const list: ExpressionNode[] = this.parseStatementList(Token.EOS);
		if (list.length === 1) {
			return list[0];
		}
		return new ExpressionStatement(list);
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
	protected parseStatement(): ExpressionNode {
		switch (this.peek().token) {
			case Token.L_CURLY:
				return this.parseBlock();
			case Token.SEMICOLON:
				this.consume(Token.SEMICOLON);
				return EmptyStatement.INSTANCE;
			case Token.IF:
				return this.parseIfStatement();
			case Token.DO:
				return this.parseDoWhileStatement();
			case Token.WHILE:
				return this.parseWhileStatement();
			case Token.FOR:
				// if (this.peekAhead().isType(Token.AWAIT)) {
				// 	return this.parseForAwaitStatement();
				// }
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
			// case Token.FUNCTION:
			// 	// FunctionDeclaration only allowed as a StatementListItem, not in
			// 	// an arbitrary Statement position. Exceptions such as
			// 	// ES#sec-functiondeclarations-in-ifstatement-statement-clauses
			// 	// are handled by calling ParseScopedStatement rather than
			// 	// ParseStatement directly.
			// 	impl() -> ReportMessageAt(scanner() -> peek_location(),
			// 		is_strict(language_mode())
			// 			? MessageTemplate.kStrictFunction
			// 			: MessageTemplate.kSloppyFunction);
			// 	return impl() -> NullStatement();
			case Token.VAR:
			case Token.LET:
			case Token.CONST:
				return this.parseVariableDeclarations();
			case Token.ASYNC:
				if (this.peekAhead().isType(Token.FUNCTION)) {
					this.consume(Token.ASYNC);
					this.consume(Token.FUNCTION);
					if (this.peek().isType(Token.MUL)) {
						return this.parseFunctionExpression(FunctionKind.ASYNC_GENERATOR);
					}
					return this.parseFunctionExpression(FunctionKind.ASYNC);
				}
			default:
				return this.parseExpressionOrLabelledStatement();
		}
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

		this.consume(Token.TRY);
		const tryBlock = this.parseBlock();
		if (tryBlock instanceof BlockStatement) {
			tryBlock.isStatement = true;
		}
		let peek = this.peek();
		if (peek.isNotType(Token.CATCH) && peek.isNotType(Token.FINALLY)) {
			throw new Error(this.errorMessage(`Uncaught SyntaxError: Missing catch or finally after try`));
		}
		let catchBlock: ExpressionNode | undefined;
		if (this.check(Token.CATCH)) {
			// bool has_binding;
			let catchVar: ExpressionNode | undefined;
			const hasBinding = this.check(Token.L_PARENTHESES);
			if (hasBinding) {
				catchVar = this.parseIdentifier();
				this.expect(Token.R_PARENTHESES);
			}
			const block = this.parseBlock();
			if (block instanceof BlockStatement) {
				block.isStatement = true;
			}
			catchBlock = new CatchClauseNode(block, catchVar);
		}
		let finallyBlock: ExpressionNode | undefined;
		if (this.check(Token.FINALLY)) {
			finallyBlock = this.parseBlock();
			if (finallyBlock instanceof BlockStatement) {
				finallyBlock.isStatement = true;
			}
		}
		return new TryCatchNode(tryBlock, catchBlock, finallyBlock);
	}
	protected parseBlock(): ExpressionNode {
		this.expect(Token.L_CURLY);
		const statements: ExpressionNode[] = [];
		const block = new BlockStatement(statements, false);
		while (this.peek().isNotType(Token.R_CURLY)) {
			const stat = this.parseStatementListItem();
			if (!stat) {
				return block;
			} else if (stat instanceof EmptyStatement) {
				continue;
			}
			statements.push(stat);
		}
		this.expect(Token.R_CURLY);
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
				this.consume(Token.FUNCTION);
				if (this.peek().isType(Token.MUL)) {
					this.consume(Token.MUL);
					return this.parseFunctionExpression(FunctionKind.GENERATOR);
				}
				return this.parseFunctionExpression(FunctionKind.NORMAL);
			case Token.CLASS:
				this.consume(Token.CLASS);
				return this.parseClassDeclaration(undefined, false);
			case Token.VAR:
			case Token.LET:
			case Token.CONST:
				return this.parseVariableDeclarations();
			case Token.ASYNC:
				if (this.peekAhead().isType(Token.FUNCTION)) {
					this.consume(Token.ASYNC);
					this.consume(Token.FUNCTION);
					if (this.peek().isType(Token.MUL)) {
						this.consume(Token.MUL);
						return this.parseFunctionExpression(FunctionKind.ASYNC_GENERATOR);
					}
					return this.parseFunctionExpression(FunctionKind.ASYNC);
				}
				break;
			default:
				break;
		}
		return this.parseStatement();
	}
	protected parseFunctionExpression(type: FunctionKind): ExpressionNode {
		let funcName: ExpressionNode | undefined;
		const peek = this.peek();
		if (peek.isNotType(Token.L_PARENTHESES)) {
			if (peek.isType(Token.L_BRACKETS)) {
				// [Symbol.iterator]() {}
				this.consume(Token.L_BRACKETS);
				funcName = this.parseMemberExpression();
				this.expect(Token.R_BRACKETS);
			} else {
				funcName = this.parseIdentifier();
			}
		}
		return this.parseFunctionLiteral(type, funcName);
	}
	protected parseIfStatement(): ExpressionNode {
		this.consume(Token.IF);
		this.consume(Token.L_PARENTHESES);
		const condition = this.parseExpression();
		this.consume(Token.R_PARENTHESES);
		const thenStatement = this.parseStatement();
		if (thenStatement instanceof BlockStatement) {
			thenStatement.isStatement = true;
		}
		let elseStatement;
		if (this.peek().isType(Token.ELSE)) {
			this.consume(Token.ELSE);
			elseStatement = this.parseStatement();
		}
		return new IfStatement(condition, thenStatement, elseStatement);
	}
	protected parseDoWhileStatement(): ExpressionNode {
		// DoStatement ::
		//   'do' Statement 'while' '(' Expression ')' ';'
		this.consume(Token.DO);
		const body = this.parseStatement();
		if (body instanceof BlockStatement) {
			body.isStatement = true;
		}
		this.expect(Token.WHILE);
		this.expect(Token.L_PARENTHESES);
		const condition = this.parseExpression();
		this.expect(Token.R_PARENTHESES);
		this.check(Token.SEMICOLON);
		return new DoWhileNode(condition, body);
	}
	protected parseWhileStatement(): ExpressionNode {
		// WhileStatement ::
		//   'while' '(' Expression ')' Statement
		this.consume(Token.WHILE);
		this.expect(Token.L_PARENTHESES);
		const condition = this.parseExpression();
		this.expect(Token.R_PARENTHESES);
		const body = this.parseStatement();
		if (body instanceof BlockStatement) {
			body.isStatement = true;
		}
		return new WhileNode(condition, body);
	}
	protected parseThrowStatement(): ExpressionNode {
		// ThrowStatement ::
		//   'throw' Expression ';'
		this.consume(Token.THROW);
		if (this.scanner.hasLineTerminatorBeforeNext()) {
			throw new Error(this.scanner.createError(`New line After Throw`));
		}
		const exception = this.parseExpression();
		this.expectSemicolon();
		return new ThrowStatement(exception);
	}
	protected parseSwitchStatement(): ExpressionNode {
		// SwitchStatement ::
		//   'switch' '(' Expression ')' '{' CaseClause* '}'
		// CaseClause ::
		//   'case' Expression ':' StatementList
		//   'default' ':' StatementList

		this.consume(Token.SWITCH);
		this.expect(Token.L_PARENTHESES);
		const tag = this.parseExpression();
		this.expect(Token.R_PARENTHESES);

		const cases: SwitchCase[] = [];
		const switchStatement = new SwitchStatement(tag, cases);

		let defaultSeen = false;
		this.expect(Token.L_CURLY);
		while (this.peek().isNotType(Token.R_CURLY)) {
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
				&& this.peek().isNotType(Token.R_CURLY)) {
				const statement = this.parseStatementListItem();
				if (!statement || this.isEmptyStatement(statement)) {
					continue;
				}
				statements.push(statement);
			}
			const block = new BlockStatement(statements, true);
			const clause = defaultSeen ? new DefaultExpression(block) : new SwitchCase(label!, block);
			cases.push(clause);
		}
		this.expect(Token.R_CURLY);
		return switchStatement;
	}
	protected parseForStatement(): ExpressionNode {
		// Either a standard for loop
		//   for (<init>; <cond>; <next>) { ... }
		// or a for-each loop
		//   for (<each> of|in <iterable>) { ... }
		//

		this.consume(Token.FOR);
		const isAwait = this.check(Token.AWAIT);
		this.expect(Token.L_PARENTHESES);
		const peek = this.peek();
		const startsWithLet = peek.isType(Token.LET) || peek.isType(Token.VAR);
		let initializer: ExpressionNode;
		if (peek.isType(Token.CONST) || (startsWithLet && this.isNextLetKeyword())) {
			initializer = this.parseVariableDeclarations();
		} else if (peek.isType(Token.SEMICOLON)) {
			initializer = EmptyStatement.INSTANCE;
		} else {
			initializer = this.parseExpressionCoverGrammar();
		}
		if (initializer instanceof BinaryExpression) {
			// x in y 
			const objectNode = initializer.getRight();
			initializer = initializer.getLeft();
			this.expect(Token.R_PARENTHESES)
			const statement = this.parseStatement();
			return new ForInNode(initializer as ForDeclaration, objectNode, statement);
		}
		const forMode = this.checkInOrOf();
		if (forMode) {
			const object = forMode === 'IN' ? this.parseAssignmentExpression() : this.parseExpression();
			this.expect(Token.R_PARENTHESES)
			const statement = this.parseStatement();
			if (statement instanceof BlockStatement) {
				statement.isStatement = true;
			}
			if (isAwait && forMode === 'OF') {
				return new ForAwaitOfNode(initializer as ForDeclaration, object, statement);
			} else if (forMode === 'OF') {
				return new ForOfNode(initializer as ForDeclaration, object, statement);
			} else if (forMode === 'IN') {
				return new ForInNode(initializer as ForDeclaration, object, statement);
			} else {
				throw new Error(this.errorMessage(`parsing for loop: ${this.position()}`));
			}
		}
		this.expect(Token.SEMICOLON);
		let condition: ExpressionNode | undefined;
		if (!this.check(Token.SEMICOLON)) {
			condition = this.parseExpression();
			this.expect(Token.SEMICOLON);
		}
		let finalExpression: ExpressionNode | undefined;
		if (!this.check(Token.R_PARENTHESES)) {
			finalExpression = this.parseExpression();
			this.expect(Token.R_PARENTHESES);
		}
		const body = this.parseStatement();
		if (body instanceof BlockStatement) {
			body.isStatement = true;
		}
		return new ForNode(body, initializer, condition, finalExpression);
	}
	protected parseVariableDeclarations(): ExpressionNode {
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
			case Token.LET:
			default:
				this.consume(token);
				mode = 'let';
				break;
		}
		const variables: VariableNode[] = [];
		do {

			let name: ExpressionNode;
			let value: ExpressionNode | undefined;
			// Check for an identifier first, so that we can elide the pattern in cases
			// where there is no initializer (and so no proxy needs to be created).
			if (Token.isAnyIdentifier(this.peek().token)) {
				name = this.parseAndClassifyIdentifier(this.next());
				if (this.isEvalOrArguments(name)) {
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
				value = this.parseAssignmentExpression();
			} else if (!this.peekInOrOf()) {
				// ES6 'const' and binding patterns require initializers.
				if (mode === 'const' && (name === undefined || value === undefined)) {
					throw new Error(this.errorMessage(`Declaration Missing Initializer : ${this.position()}`));
				}
				// value = undefined;
			}
			variables.push(new VariableNode(name as DeclareExpression, value));
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
			if (this.isEvalOrArguments(name)) {
				throw new Error(this.errorMessage(`Strict Eval Arguments`));
			}
			return name;
		}
		if (token == Token.L_BRACKETS) {
			return this.parseArrayLiteral(isPattern);
		} else if (token == Token.L_CURLY) {
			return this.parseObjectLiteral(isPattern);
		} else {
			throw new Error(this.errorMessage(`Unexpected Token: ${this.next().getValue()}`));
		}
	}
	protected parseAndClassifyIdentifier(next: TokenExpression): ExpressionNode {
		if (next.isType(Token.IDENTIFIER)) {
			return next.getValue();
		}
		else if (next.isType(Token.SET)) {
			const value = this.parseFunctionDeclaration();
			return new Property(next.getValue(), value as DeclareExpression, 'set');
		}
		else if (next.isType(Token.GET)) {
			const value = this.parseFunctionDeclaration();
			return new Property(next.getValue(), value as DeclareExpression, 'get');
		}
		else if (next.isType(Token.AWAIT)) {
			throw new Error(this.errorMessage(`un supported expression (await)`));

		}
		return next.getValue();
	}
	protected parseContinueStatement(): ExpressionNode {
		// ContinueStatement ::
		//   'continue' ';'
		// Identifier? is not supported

		this.consume(Token.CONTINUE);
		this.expectSemicolon();
		return ContinueStatement.CONTINUE_INSTANCE;
	}
	protected parseBreakStatement(): ExpressionNode {
		// BreakStatement ::
		//   'break' ';'
		// Identifier? is not supported

		this.consume(Token.BREAK);
		this.expectSemicolon();
		return BreakStatement.BREAK_INSTANCE;
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
			// if (this.isDerivedConstructor(function_state_ -> kind())) {
			// 	returnValue = ThisNode;
			// }
		} else {
			returnValue = this.parseExpression();
		}
		this.expectSemicolon()
		return new ReturnStatement(returnValue);
	}
	protected parseExpressionOrLabelledStatement(): ExpressionNode {
		// ExpressionStatement | LabelledStatement ::
		//   Expression ';'
		//   Identifier ':' Statement
		//
		// ExpressionStatement[Yield] :
		//   [lookahead notin {{, function, class, let [}] Expression[In, ?Yield] ;

		switch (this.peek().token) {
			case Token.FUNCTION:
			case Token.L_CURLY:
				throw new Error(this.errorMessage(`Unreachable state`));
			case Token.CLASS:
				throw new Error(this.errorMessage(`Unexpected Token ${this.next().getValue().toString()}`));
			case Token.LET: {
				const nextNext = this.peekAhead();
				// "let" followed by either "[", "{" or an identifier means a lexical
				// declaration, which should not appear here.
				// However, ASI may insert a line break before an identifier or a brace.
				if (nextNext.isNotType(Token.L_BRACKETS) &&
					((nextNext.isNotType(Token.L_CURLY) && nextNext.isNotType(Token.IDENTIFIER)))) {
					break;
				}
				throw new Error(this.errorMessage(`Unexpected Lexical Declaration ${this.position()}`));
			}
			default:
				break;
		}
		const startsWithIdentifier = Token.isAnyIdentifier(this.peek().token);
		const expression: ExpressionNode = this.parseExpressionCoverGrammar();
		if (this.peek().isType(Token.COLON) && startsWithIdentifier && this.isIdentifier(expression)) {
			// The whole expression was a single identifier, and not, e.g.,
			// something starting with an identifier or a parenthesized identifier.

			// Remove the "ghost" variable that turned out to be a label from the top
			// scope. This way, we don't try to resolve it during the scope
			// processing.

			this.consume(Token.COLON);
			// ES#sec-labelled-function-declarations Labelled Function Declarations
			if (this.peek().isType(Token.FUNCTION) /*&& allow_function == kAllowLabelledFunctionStatement */) {
				return this.parseFunctionDeclaration();
			}
			return this.parseStatement();
		}
		// Parsed expression statement, followed by semicolon.
		this.expectSemicolon();
		return expression;
	}
	protected parseExpression(): ExpressionNode {
		return this.parseExpressionCoverGrammar();
	}
	protected parseFunctionDeclaration(): ExpressionNode {
		this.consume(Token.FUNCTION);
		if (this.check(Token.MUL)) {
			throw new Error(this.errorMessage(`Error Generator In Single Statement Context`));
		}
		return this.parseHoistableDeclaration(FunctionKind.NORMAL);
	}
	protected parseFunctionDeclarationAndGenerator() {
		this.consume(Token.FUNCTION);
		if (this.check(Token.MUL)) {
			return this.parseHoistableDeclaration(FunctionKind.GENERATOR);
		}
		return this.parseHoistableDeclaration(FunctionKind.NORMAL);
	}
	protected parseHoistableDeclaration(flag: FunctionKind): ExpressionNode {
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

		if (FunctionKind.ASYNC === flag && this.check(Token.MUL)) {
			// Async generator
			flag = FunctionKind.ASYNC_GENERATOR;
		}
		let name: ExpressionNode | undefined;
		if (this.peek().isNotType(Token.L_PARENTHESES)) {
			name = this.parseIdentifier();
		}
		return this.parseFunctionLiteral(flag, name);
	}
	protected parseIdentifier(): ExpressionNode | undefined {
		const next = this.next();
		if (!Token.isValidIdentifier(next.token)) {
			throw new Error(this.errorMessage(`Unexpected Token: ${next.getValue()}`));
		}
		if (next.isType(Token.IDENTIFIER)) {
			return next.getValue();
		}
		return this.getIdentifier();
	}
	protected getIdentifier(): ExpressionNode {
		const current = this.current();
		const string = current.getValue().toString();
		switch (current.token) {
			case Token.AWAIT:
				return AwaitIdentifier;
			case Token.ASYNC:
				return AsyncIdentifier;
			case Token.PRIVATE_NAME:
				return new Identifier(`#${string}`);
			default:
				break;
		}
		if (string == 'constructor') {
			return ConstructorIdentifier;
		}
		if (string == 'name') {
			return NameIdentifier;
		}
		if (string == 'eval') {
			return EvalIdentifier;
		}
		else if (string == 'arguments') {
			return ArgumentsIdentifier;
		}
		throw new Error(this.errorMessage(`can't identify token ${string}`));
	}
	protected parseFunctionLiteral(flag: FunctionKind, name?: ExpressionNode): ExpressionNode {
		// Function ::
		//   '(' FormalParameterList? ')' '{' FunctionBody '}'

		const functionInfo: FunctionInfo = {};
		this.expect(Token.L_PARENTHESES);
		const formals: ExpressionNode[] = this.parseFormalParameterList(functionInfo);
		this.expect(Token.R_PARENTHESES);
		const body = this.parseFunctionBody();
		return new FunctionExpression(formals, body, flag, name, functionInfo.rest);
	}
	protected parseFunctionBody(): ExpressionNode[] {
		const isExpression = this.peek().isNotType(Token.L_CURLY);
		if (isExpression) {
			const expression = this.parseAssignmentExpression();
			return [expression];
		} else {
			this.expect(Token.L_CURLY);
			const list = this.parseStatementList(Token.R_CURLY);
			this.expect(Token.R_CURLY);
			return list;
		}
	}
	protected parseStatementList(endToken: Token): ExpressionNode[] {
		// StatementList ::
		//   (StatementListItem)* <end_token>
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
		if (this.peek().isNotType(Token.R_PARENTHESES)) {
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
				if (this.peek().isType(Token.R_PARENTHESES)) {
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
		let pattern = this.parseBindingPattern(true);
		let initializer: Param;
		if (this.check(Token.ASSIGN)) {
			if (functionInfo.rest) {
				throw new Error(this.errorMessage(`Rest Default Initializer`));
			}
			const value = this.parseAssignmentExpression();
			initializer = new Param(pattern, value);
		} else {
			initializer = new Param(pattern);
		}
		return initializer;
	}
	protected parseExpressionCoverGrammar(info?: FunctionInfo): ExpressionNode {
		// Expression ::
		//   AssignmentExpression
		//   Expression ',' AssignmentExpression

		// ExpressionListT list(pointer_buffer());
		// ExpressionT expression;
		// AccumulationScope accumulation_scope(expression_scope());
		let variableIndex = 0;
		const list: ExpressionNode[] = [];
		let expression: ExpressionNode;
		while (true) {
			if (this.peek().isType(Token.ELLIPSIS)) {
				if (info) {
					info.rest = true;
				}
				return this.parseArrowParametersWithRest(list, variableIndex);
			}
			expression = this.parseAssignmentExpressionCoverGrammar();
			list.push(expression);

			if (!this.check(Token.COMMA)) break;

			if (this.peek().isType(Token.R_PARENTHESES) && this.peekAhead().isType(Token.ARROW)) {
				// a trailing comma is allowed at the end of an arrow parameter list
				break;
			}
		}
		if (list.length == 1) return expression;
		return this.expressionListToExpression(list);
	}
	protected parseArrowParametersWithRest(list: ExpressionNode[], variableIndex: number): ExpressionNode {
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
		if (this.peek().isNotType(Token.R_PARENTHESES) || this.peekAhead().isNotType(Token.ARROW)) {
			throw new Error(this.errorMessage(`Error Unexpected Token At ${this.position()}`));
		}
		list.push(pattern);
		return this.expressionListToExpression(list);
	}
	protected expressionListToExpression(list: ExpressionNode[]): ExpressionNode {
		if (list.length === 1) { return list[0]; }
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
			return new Param(expression.getLeft(), expression.getRight());
		}
		if (expression instanceof GroupingExpression) {
			return new Param(expression.getNode());
		}
		return new Param(expression);
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
			let kind: ArrowFunctionType = ArrowFunctionType.NORMAL;
			if (token.isType(Token.ASYNC) && !this.scanner.hasLineTerminatorBeforeNext()) {
				// async function ...
				if (this.peek().isType(Token.FUNCTION)) {
					return this.parseFunctionDeclarationAndGenerator();
				};
				// async Identifier => ...
				if (Token.isAnyIdentifier(this.peek().token) && this.peekAhead().isType(Token.ARROW)) {
					token = this.next();
					kind = ArrowFunctionType.ASYNC;
				}
			}
			if (this.peek().isType(Token.ARROW)) {
				const name = this.parseAndClassifyIdentifier(token);
				const params: Param[] = [];
				if (name instanceof SequenceExpression) {
					params.push(...name.getExpressions().map(this.toParamNode));
				} else {
					params.push(this.toParamNode(name));
				}
				return this.parseArrowFunctionLiteral(params, kind);
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
				return ThisNode;
			case Token.DIV:
			case Token.DIV_ASSIGN:
				// case Token.REGEXP_LITERAL:
				// this.consume(Token.REGEXP_LITERAL);
				// return token.value!;
				return this.parseRegExpLiteral();
			case Token.FUNCTION:
				this.consume(Token.FUNCTION);
				if (this.peek().isType(Token.MUL)) {
					this.consume(Token.MUL);
					return this.parseFunctionExpression(FunctionKind.GENERATOR);
				}
				return this.parseFunctionExpression(FunctionKind.NORMAL);
			case Token.SUPER: {
				return this.parseSuperExpression();
			}
			case Token.IMPORT:
				return this.parseImportExpressions();

			case Token.L_BRACKETS:
				return this.parseArrayLiteral(false);

			case Token.L_CURLY:
				return this.parseObjectLiteral(false);

			case Token.L_PARENTHESES: {
				this.consume(Token.L_PARENTHESES);
				if (this.check(Token.R_PARENTHESES)) {
					// ()=>x.  The continuation that consumes the => is in
					// ParseAssignmentExpressionCoverGrammar.

					if (!this.peek().isType(Token.ARROW)) {
						throw new Error(this.errorMessage(`Unexpected Token: ${Token.R_PARENTHESES.getName()}`));
					}
					return this.parseArrowFunctionLiteral([], ArrowFunctionType.NORMAL);
				}
				// Heuristically try to detect immediately called functions before
				// seeing the call parentheses.

				const peekToken = this.peek();
				let expression: ExpressionNode;
				const info: FunctionInfo = {};
				if (peekToken.isType(Token.FUNCTION)) {
					this.consume(Token.FUNCTION);
					expression = this.parseFunctionLiteral(FunctionKind.NORMAL);
				} else if (peekToken.isType(Token.ASYNC) && this.peekAhead().isType(Token.FUNCTION)) {
					this.consume(Token.ASYNC);
					this.consume(Token.FUNCTION);
					expression = this.parseFunctionLiteral(FunctionKind.ASYNC);
				} else {
					expression = this.parseExpressionCoverGrammar(info);
				}
				this.expect(Token.R_PARENTHESES);
				if (this.peek().isType(Token.ARROW)) {
					expression = this.parseArrowFunctionLiteral([expression], ArrowFunctionType.NORMAL, info.rest);
				}
				return expression;
			}
			case Token.CLASS: {
				this.consume(Token.CLASS);
				let name: ExpressionNode | undefined;
				let isStrictReserved = false;
				if (this.peekAnyIdentifier()) {
					name = this.parseAndClassifyIdentifier(this.next());
					isStrictReserved = Token.isStrictReservedWord(this.current().token);
				}
				return this.parseClassLiteral(name, isStrictReserved);
			}
			case Token.TEMPLATE_LITERALS:
				return this.parseTemplateLiteral();
			default:
				break;
		}
		throw new Error(this.errorMessage(`Unexpected Token: ${JSON.stringify(this.next())}`));
	}
	protected parseTemplateLiteral(tag?: ExpressionNode): ExpressionNode {
		const template = this.next().getValue() as PreTemplateLiteral;
		const exprs = template.expressions.map(expr => JavaScriptParser.parse(expr));

		if (tag) {
			return new TaggedTemplateExpression(tag, template.strings, exprs);
		} else {
			return new TemplateLiteral(template.strings, exprs);
		}
	}
	protected parseMemberWithPresentNewPrefixesExpression(): ExpressionNode {
		this.consume(Token.NEW);
		let classRef: ExpressionNode;
		if (this.peek().isType(Token.IMPORT) && this.peekAhead().isType(Token.L_PARENTHESES)) {
			throw new Error(this.errorMessage(`parsing new import (`));
		} else if (this.peek().isType(Token.SUPER)) {
			throw new Error(this.errorMessage(`parsing new super() is never allowed`));
		} else if (this.peek().isType(Token.PERIOD)) {
			classRef = this.parseNewTargetExpression();
			return this.parseMemberExpressionContinuation(classRef);
		} else {
			classRef = this.parseMemberExpression();
		}
		if (this.peek().isType(Token.L_PARENTHESES)) {
			// NewExpression with arguments.
			const args: ExpressionNode[] = this.parseArguments();
			classRef = new NewExpression(classRef, args);
			// The expression can still continue with . or [ after the arguments.
			return this.parseMemberExpressionContinuation(classRef);
		}
		if (this.peek().isType(Token.QUESTION_PERIOD)) {
			throw new Error(this.errorMessage(`parsing new xxx?.yyy at position`));
		}
		return new NewExpression(classRef);
	}
	protected parseArguments(maybeArrow?: ParsingArrowHeadFlag): ExpressionNode[] {
		// Arguments ::
		//   '(' (AssignmentExpression)*[','] ')'

		this.consume(Token.L_PARENTHESES);
		const args: ExpressionNode[] = [];
		while (this.peek().isNotType(Token.R_PARENTHESES)) {
			const isSpread = this.check(Token.ELLIPSIS);
			let argument: ExpressionNode = this.parseAssignmentExpressionCoverGrammar();
			if (ParsingArrowHeadFlag.MaybeArrowHead === maybeArrow) {
				if (isSpread) {
					if (argument instanceof AssignmentExpression) {
						throw new Error(this.errorMessage(` Rest parameter may not have a default initializer'`));
					}
					if (this.peek().isType(Token.COMMA)) {
						throw new Error(this.errorMessage(`parsing '...spread,arg =>'`));
					}
				}
			}
			if (isSpread) {
				argument = new SpreadElement(argument);
			}
			args.push(argument);
			if (!this.check(Token.COMMA)) break;
		}
		if (!this.check(Token.R_PARENTHESES)) {
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

		if (this.peek().isType(Token.YIELD) /*&& this.isGenerator()*/) {
			return this.parseYieldExpression();
		}
		let expression: ExpressionNode = this.parseConditionalExpression();
		const op = this.peek().token;
		if (!Token.isArrowOrAssignmentOp(op)) return expression;
		// Arrow functions.
		if (op === Token.ARROW) {
			if (!this.isIdentifier(expression) && !this.isParenthesized(expression)) {
				throw new Error(this.errorMessage(`Malformed Arrow Fun Param List`));
			}
			if (expression instanceof SequenceExpression) {
				const params = expression.getExpressions().map(expr => new Param(expr));
				return this.parseArrowFunctionLiteral(params, ArrowFunctionType.NORMAL);
			}
			if (expression instanceof GroupingExpression) {
				return this.parseArrowFunctionLiteral([new Param(expression.getNode())], ArrowFunctionType.NORMAL);
			}
			return this.parseArrowFunctionLiteral([new Param(expression)], ArrowFunctionType.NORMAL);
		}
		if (this.isAssignableIdentifier(expression)) {
			if (this.isParenthesized(expression)) {
				throw new Error(this.errorMessage(`Invalid Destructuring Target`));
			}
		} else if (this.isProperty(expression)) {
			// throw new Error(this.errorMessage(`Invalid Property Binding Pattern`));
		} else if (this.isPattern(expression) && Token.isAssignment(op)) {
			// Destructuring assignment.
			if (this.isParenthesized(expression)) {
				// Scanner.Location loc(lhs_beg_pos, end_position());
				// if (expression_scope() -> IsCertainlyDeclaration()) {
				// 	impl() -> ReportMessageAt(loc,
				// 		MessageTemplate.kInvalidDestructuringTarget);
				// } else {
				// 	// Syntax Error if LHS is neither object literal nor an array literal
				// 	// (Parenthesized literals are
				// 	// CoverParenthesizedExpressionAndArrowParameterList).
				// 	// #sec-assignment-operators-static-semantics-early-errors
				// 	impl() -> ReportMessageAt(loc, MessageTemplate.kInvalidLhsInAssignment);
				// }
			}
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
	protected parseArrowFunctionLiteral(parameters: ExpressionNode[], flag: ArrowFunctionType, rest?: boolean): ExpressionNode {
		this.consume(Token.ARROW);
		const body = this.parseFunctionBody();
		return new ArrowFunctionExpression(parameters, body, flag, rest);
	}
	protected parseRegExpLiteral(): ExpressionNode {
		if (!this.scanner.scanRegExpPattern()) {
			throw new Error('Unterminated RegExp');
		}
		return this.scanner.currentToken().getValue();
	}
	protected parseArrayLiteral(isPattern: boolean): ExpressionNode {
		// ArrayLiteral ::
		//   '[' Expression? (',' Expression?)* ']'

		this.consume(Token.L_BRACKETS);
		const values: ExpressionNode[] = [];
		let firstSpreadIndex = -1;

		while (!this.check(Token.R_BRACKETS)) {
			let elem: ExpressionNode;
			if (this.peek().isType(Token.COMMA)) {
				this.consume(Token.COMMA);
				continue;
			} else if (this.check(Token.ELLIPSIS)) {
				const argument: ExpressionNode = this.parsePossibleDestructuringSubPattern();
				const constr = isPattern ? RestElement : SpreadElement;
				elem = new constr(argument as DeclareExpression);

				if (firstSpreadIndex < 0) {
					firstSpreadIndex = values.length;
				}
				if (this.peek().isType(Token.COMMA)) {
					throw new Error(this.errorMessage(`Element After Rest @${this.position()}`));
				}
			} else {
				elem = this.parsePossibleDestructuringSubPattern();
			}
			values.push(elem);
		}
		if (isPattern) {
			return new ArrayPattern(values as DeclareExpression[]);
		}
		return new ArrayExpression(values);
	}
	protected parsePossibleDestructuringSubPattern(): ExpressionNode {
		return this.parseAssignmentExpressionCoverGrammar();
	}
	protected parseObjectLiteral(isPattern: boolean): ExpressionNode {
		// ObjectLiteral ::
		// '{' (PropertyDefinition (',' PropertyDefinition)* ','? )? '}'

		this.consume(Token.L_CURLY);
		const properties: ExpressionNode[] = [];
		while (!this.check(Token.R_CURLY)) {
			const property: ExpressionNode = this.parseObjectPropertyDefinition(isPattern);
			properties.push(property);
			if (this.peek().isNotType(Token.R_CURLY)) {
				this.expect(Token.COMMA);
			}
		}
		if (isPattern) {
			return new ObjectPattern(properties as (Property | RestElement)[]);
		}
		return new ObjectExpression(properties as Property[]);
	}
	protected parseObjectPropertyDefinition(isPattern: boolean): ExpressionNode {
		const propInfo = { kind: PropertyKind.NotSet } as Required<PropertyKindInfo>;
		const nameExpression = this.parseProperty(propInfo);

		switch (propInfo.kind) {
			case PropertyKind.Spread:
				let value: SpreadElement | RestElement = nameExpression as SpreadElement;
				if (isPattern) {
					value = new RestElement(value.getArgument() as DeclareExpression);
				}
				return new Property(value.getArgument(), value, 'init');

			case PropertyKind.Value: {
				this.consume(Token.COLON);
				const value = this.parsePossibleDestructuringSubPattern();
				return new Property(nameExpression, value, 'init');
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
					const rhs = this.parseAssignmentExpression();
					value = new AssignmentExpression(Token.ASSIGN.getName() as AssignmentOperator, lhs, rhs);
				} else {
					value = lhs;
				}
				return new Property(nameExpression, value, 'init');
			}

			case PropertyKind.Method: {
				// MethodDefinition
				//    PropertyName '(' StrictFormalParameters ')' '{' FunctionBody '}'
				//    '*' PropertyName '(' StrictFormalParameters ')' '{' FunctionBody '}'

				const value = this.parseFunctionLiteral(propInfo.funcFlag);
				return new Property(nameExpression, value, 'init');
			}

			case PropertyKind.AccessorGetter:
			case PropertyKind.AccessorSetter: {
				const isGet = propInfo.kind == PropertyKind.AccessorGetter;
				const value = this.parseFunctionLiteral(propInfo.funcFlag);
				return new Property(nameExpression, value, isGet ? 'get' : 'set');
			}

			case PropertyKind.ClassField:
			case PropertyKind.NotSet:
				return NullNode;
		}
	}
	protected parseProperty(propInfo: PropertyKindInfo): ExpressionNode {
		let nextToken = this.peek();
		if (this.check(Token.ASYNC)) {
			// async
			nextToken = this.peek();
			if (nextToken.isNotType(Token.MUL)
				&& parsePropertyKindFromToken(nextToken.token, propInfo)
				|| this.scanner.hasLineTerminatorBeforeNext()) {
				return AsyncIdentifier;
			}
			propInfo.kind = PropertyKind.Method;
			propInfo.funcFlag = FunctionKind.ASYNC;
		}

		if (this.check(Token.MUL)) {
			// async*
			propInfo.kind = PropertyKind.Method;
			propInfo.funcFlag = FunctionKind.ASYNC_GENERATOR;
		}

		nextToken = this.peek();
		if (propInfo.kind == PropertyKind.NotSet && nextToken.isType(Token.GET) || nextToken.isType(Token.SET)) {
			const token = this.next();
			if (parsePropertyKindFromToken(this.peek().token, propInfo)) {
				return nextToken.isType(Token.GET) ? GetIdentifier : SetIdentifier;
			}
			if (token.isType(Token.GET)) {
				propInfo.kind = PropertyKind.AccessorGetter;
			} else if (token.isType(Token.SET)) {
				propInfo.kind = PropertyKind.AccessorSetter;
			}
		}
		let propertyName: ExpressionNode;
		switch (nextToken.token) {
			case Token.PRIVATE_NAME:
				this.consume(Token.PRIVATE_NAME);
				if (propInfo.kind == PropertyKind.NotSet) {
					parsePropertyKindFromToken(this.peek().token, propInfo);
				}
				propertyName = this.getIdentifier();
				break;
			case Token.STRING:
			case Token.NUMBER:
			case Token.BIGINT:
				//   "12" -> 12
				//   12.3 -> "12.3"
				//   12.30 -> "12.3"
				this.consume(nextToken.token);
				propertyName = nextToken.getValue();
				propInfo.name = (propertyName as StringLiteral).getValue();
				break;
			case Token.L_BRACKETS:
				// [Symbol.iterator]
				this.consume(Token.L_BRACKETS);
				propertyName = this.parseAssignmentExpression();
				this.expect(Token.R_BRACKETS);
				if (propInfo.kind === PropertyKind.NotSet) {
					parsePropertyKindFromToken(this.peek().token, propInfo);
				}
				propInfo.name = propertyName.toString();
				return propertyName;
			case Token.ELLIPSIS:
				if (propInfo.kind == PropertyKind.NotSet) {
					this.consume(Token.ELLIPSIS);
					propertyName = this.parsePossibleDestructuringSubPattern();
					propInfo.kind = PropertyKind.Spread;

					if (!this.isValidReferenceExpression(propertyName)) {
						throw new Error(this.errorMessage('Invalid Rest Binding/Assignment Pattern'));
					}
					if (this.peek().isNotType(Token.R_CURLY)) {
						throw new Error(this.errorMessage('Element After Rest'));
					}
					propInfo.name = propertyName.toString();
					return propertyName;
				}
			default:
				propertyName = new StringLiteral(this.parsePropertyName().toString());
				// propertyName = this.parsePropertyName();
				propInfo.name = propertyName.toString();
				break;
		}
		if (propInfo.kind === PropertyKind.NotSet) {
			parsePropertyKindFromToken(this.peek().token, propInfo);
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
				case Token.L_BRACKETS: {
					this.consume(Token.L_BRACKETS);
					const index = this.parseExpressionCoverGrammar();
					expression = new MemberExpression(expression, index, true);
					this.expect(Token.R_BRACKETS);
					break;
				}
				case Token.PERIOD: {
					this.consume(Token.PERIOD);
					const key: ExpressionNode = this.parsePropertyName();
					expression = new MemberExpression(expression, key, false);
					break;
				}
				case Token.TEMPLATE_LITERALS: {
					expression = this.parseTemplateLiteral(expression);
					break;
				}
				default:
					break;
			}
		} while (Token.isMember(this.peek().token));
		return expression;
	}
	protected parsePropertyName(): ExpressionNode {
		const next = this.next();
		if (next.getValue() instanceof Identifier) {
			return next.getValue();
		}
		// check keyword as identifier
		if (Token.isPropertyName(next.token)) {
			return new Identifier(next.token.getName());
		}
		throw new Error(this.errorMessage(`Parsing property expression: Unexpected Token`));
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


		while (this.peek().isType(Token.PIPELINE)) {
			this.consume(Token.PIPELINE);
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
							const arg = this.parseLogicalExpression();
							if (isSpread) {
								args.push(new SpreadElement(arg));
							} else {
								args.push(arg);
							}
						}
					} while (this.peek().isType(Token.COLON));
					break;
				case Token.L_PARENTHESES:
					// es2020 syntax
					this.consume(Token.L_PARENTHESES);
					while (this.peek().isNotType(Token.R_PARENTHESES)) {
						const isSpread = this.check(Token.ELLIPSIS);
						if (this.peek().isType(Token.CONDITIONAL)) {
							this.consume(Token.CONDITIONAL);
							if (isSpread) {
								args.push('...?');
							} else {
								args.push('?');
							}
						} else {
							const arg = this.parseLogicalExpression();
							if (isSpread) {
								args.push(new SpreadElement(arg));
							} else {
								args.push(arg);
							}
						}
					}
					this.expect(Token.R_PARENTHESES);
					break;
				default:
					break;
			}
			expression = new PipelineExpression(expression, func, args);
		}
		return expression;
	}
	protected parseBindPipelineExpression(expression: ExpressionNode): ExpressionNode {
		// ConditionalExpression ::
		//   LogicalExpression
		//   expression ':|>' function [':' expression [':' expression | '?'| '...?'] ] *
		//   expression ':|>' function '('[expression ',' (? | ...?)]* ')'
		//
		//   expression ':|>' function ':' expression [':' expression ]*]
		//   expression ':|>' function '(' expression [',' expression ]* ')'

		while (this.peek().isType(Token.BIND_PIPELINE)) {
			this.consume(Token.BIND_PIPELINE);
			const func = this.parseMemberExpression(); //this.parseLogicalExpression();
			let args: ExpressionNode[] = [];
			switch (this.peek().token) {
				case Token.COLON:
					// support angular pipeline syntax
					do {
						this.consume(Token.COLON);
						const isSpread = this.check(Token.ELLIPSIS);
						const arg = this.parseLogicalExpression();
						if (isSpread) {
							args.push(new SpreadElement(arg));
						} else {
							args.push(arg);
						}
					} while (this.peek().isType(Token.COLON));
					break;
				case Token.L_PARENTHESES:
					// es2020 syntax
					this.consume(Token.L_PARENTHESES);
					while (this.peek().isNotType(Token.R_PARENTHESES)) {
						const isSpread = this.check(Token.ELLIPSIS);
						const arg = this.parseLogicalExpression();
						if (isSpread) {
							args.push(new SpreadElement(arg));
						} else {
							args.push(arg);
						}
					}
					this.expect(Token.R_PARENTHESES);
					break;
				default:
					break;
			}
			expression = new PipelineExpression(expression, func, args);
		}
		return expression;
	}
	protected parseConditionalExpression(): ExpressionNode {
		// ConditionalExpression ::
		//   LogicalExpression
		//   LogicalExpression '?' AssignmentExpression ':' AssignmentExpression
		//

		let expression: ExpressionNode = this.parseLogicalExpression();
		expression = this.parsePipelineExpression(expression);
		expression = this.parseBindPipelineExpression(expression);
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
			const precedence = peek.token.getPrecedence();
			expression = this.parseBinaryContinuation(expression, 4, precedence);
		} else if (peek.isType(Token.NULLISH)) {
			expression = this.parseNullishExpression(expression);
		}
		return expression;
	}
	protected parseBinaryContinuation(x: ExpressionNode, prec: number, prec1: number): ExpressionNode {
		do {
			// prec1 >= 4
			while (this.peek().token.getPrecedence() === prec1) {
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
	protected parseBinaryExpression(precedence: number): ExpressionNode {
		const x: ExpressionNode = this.parseUnaryExpression();
		const precedence1 = this.peek().token.getPrecedence();
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
		if (op.isType(Token.AWAIT)) {
			return this.parseAwaitExpression();
		}
		return this.parsePostfixExpression();
	}
	protected parseUnaryOrPrefixExpression(): ExpressionNode {
		const op = this.next();
		const expression = this.parseUnaryExpression();
		if (Token.isUnary(op.token)) {
			if (op.isType(Token.DELETE)) {
				if (this.isIdentifier(expression)) {
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
		if (this.peek().isType(Token.L_PARENTHESES)
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
					const key = this.parsePropertyName();
					result = new ChainExpression(result, key, 'property');
					break;
				}

				/* Property */
				case Token.L_BRACKETS: {
					this.consume(Token.L_BRACKETS);
					const index = this.parseExpressionCoverGrammar();
					result = new MemberExpression(result, index, true);
					this.expect(Token.R_BRACKETS);
					break;
				}

				/* Property */
				case Token.PERIOD: {
					if (isOptional) {
						throw new Error(this.errorMessage(`Unexpected Token:${this.position()}`));
					}
					this.consume(Token.PERIOD);
					const key = this.parsePropertyName();
					result = new MemberExpression(result, key, false);
					break;
				}

				/* Call */
				case Token.L_PARENTHESES: {
					const args = this.parseArguments();
					if (result.toString() === 'eval') {
						throw new Error(this.errorMessage(`'eval(...)' is not supported.`));
					}
					result = new CallExpression(result, args);
					break;
				}

				/* bind call */
				case Token.BIND: {
					if (isOptional) {
						throw new Error(this.errorMessage(`Unexpected Token:${this.position()}`));
					}
					this.consume(Token.BIND);
					const key = this.parsePropertyName();
					result = new BindExpression(result, key, false);
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
					const key = this.parsePropertyName();
					result = new ChainBindExpression(result, key, false);
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
		const left: ExpressionNode = this.parseAssignmentExpression();
		this.expect(Token.COLON);
		const right = this.parseAssignmentExpression();
		return new ConditionalExpression(expression, left, right);
	}
	protected parseYieldExpression(): ExpressionNode {
		// YieldExpression ::
		//   'yield' ([no line terminator] '*'? AssignmentExpression)?
		this.consume(Token.YIELD);
		let delegating = false;  // yield*
		let expression: ExpressionNode;
		if (this.check(Token.MUL)) {
			delegating = true;
		}
		switch (this.peek().token) {
			case Token.EOS:
			case Token.SEMICOLON:
			case Token.R_CURLY:
			case Token.R_BRACKETS:
			case Token.R_PARENTHESES:
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
		// }

		throw new Error(this.errorMessage(`Yield expression is not supported now.`));
		// // Hackily disambiguate o from o.next and o [Symbol.iterator]().
		// // TODO(verwaest): Come up with a better solution.
		// return new YieldNode(expression!);
	}
	protected parseNewTargetExpression(): ExpressionNode {
		throw new Error(this.errorMessage('Expression (new.target) not supported.'));
	}
	protected parseClassDeclaration(names: ExpressionNode[] | undefined, defaultExport: boolean): ExpressionNode {
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
