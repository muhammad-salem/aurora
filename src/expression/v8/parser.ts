import type { ExpressionNode } from '../api/expression.js';
import { Token, TokenExpression } from './token.js';
import { TokenStream } from './stream.js';
import { OfNode, IdentifierNode, ThisNode, RegExpNode } from '../api/definition/values.js';
import { EmptyNode } from '../api/statement/controlflow/empty.js';
import { BlockNode } from '../api/statement/controlflow/block.js';
import { ArrowFunctionNode, ArrowFunctionType, FunctionDeclarationNode, FunctionType, ParamterNode } from '../api/definition/function.js';
import { IfElseNode } from '../api/statement/controlflow/if.js';
import { NewNode } from '../api/computing/new.js';
import { SpreadSyntaxNode } from '../api/computing/spread.js';
import { AssignmentNode } from '../api/operators/assignment.js';
import { GroupingNode } from '../api/operators/grouping.js';
import { AccessNode, ComputedMemberAccessNode, MemberAccessNode } from '../api/definition/member.js';
import { GetPropertyNode, ObjectLiteralNode, ObjectLiteralPropertyNode, SetPropertyNode } from '../api/definition/object.js';
import { ArrayLiteralNode } from '../api/definition/array.js';
import { FunctionCallNode } from '../api/computing/function.js';
import { DoWhileNode, WhileNode } from '../api/statement/iterations/while.js';
import { ThrowExpressionNode } from '../api/computing/throw.js';
import { CaseExpression, DefaultExpression, SwitchNode } from '../api/statement/controlflow/switch.js';
import { TerminateNode } from '../api/statement/controlflow/terminate.js';
import { ReturnNode } from '../api/computing/return.js';
import { ConstNode, LetNode, Variable } from '../api/statement/declarations/declares.js';
import { ForNode, ForOfNode, ForInNode, ForAwaitOfNode } from '../api/statement/iterations/for.js';
import { TernaryNode } from '../api/operators/ternary.js';
import { PipelineNode } from '../api/operators/pipeline.js';
import { LogicalNode } from '../api/operators/logical.js';
import { CommaNode } from '../api/operators/comma.js';
import { RestParameterNode } from '../api/definition/rest.js';
import { buildPostfixExpression, buildUnaryExpression, shortcutNumericLiteralBinaryExpression } from './nodes.js';
import { OptionalChainingNode } from '../api/operators/chaining.js';
import { StatementNode } from '../api/definition/statement.js';


enum ParsingArrowHeadFlag { CertainlyNotArrowHead, MaybeArrowHead, AsyncArrowFunction }


export abstract class AbstractParser {
	constructor(protected scanner: TokenStream) { }
	abstract scan(): ExpressionNode;

	protected position() {
		return this.scanner.getPos();
	}
	protected next() {
		return this.scanner.next();
	}
	protected peek(): TokenExpression {
		return this.scanner.peek();
	}
	protected peekPosition() {
		return this.scanner.peekPosition();
	}
	protected peekAhead(): TokenExpression {
		return this.scanner.peekAhead();
	}
	protected peekAheadPosition() {
		return this.scanner.peekAheadPosition();
	}
	protected consume(token: Token) {
		if (this.scanner.next().token !== token) {
			throw new Error(`Error parsing ${token}`);
		}
	}
	protected check(token: Token): boolean {
		const next = this.scanner.peek();
		if (next.token == token) {
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
		const next = this.scanner.next();
		if (next.token !== token) {
			throw new Error(`Unexpected Token: ${token}`);
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
	protected isEvalOrArguments(value: ExpressionNode): boolean {
		const next = this.scanner.peek();
		if (next.value?.toString() === 'eval') {
			this.scanner.next();
			return true;
		} else if (next.value instanceof IdentifierNode) {
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
	protected isIdentifier(expression: ExpressionNode): expression is IdentifierNode {
		return expression instanceof IdentifierNode;
	}
	protected isParenthesized(expression: ExpressionNode): expression is GroupingNode {
		return expression instanceof GroupingNode;
	}
	protected isAssignableIdentifier(expression: ExpressionNode): expression is AssignmentNode {
		return expression instanceof AssignmentNode;
	}
	protected isPattern(expression: ExpressionNode): expression is (ObjectLiteralNode | ArrayLiteralNode) {
		return expression instanceof ObjectLiteralNode || expression instanceof ArrayLiteralNode;
	}
	protected isProperty(expression: ExpressionNode): expression is (MemberAccessNode | ComputedMemberAccessNode) {
		return expression instanceof MemberAccessNode || expression instanceof ComputedMemberAccessNode;
	}
	protected isCallNew(expression: ExpressionNode): expression is NewNode {
		return expression instanceof NewNode;
	}
	protected isCall(expression: ExpressionNode): expression is FunctionCallNode {
		return expression instanceof FunctionCallNode;
	}
	protected isEmptyStatement(expression: ExpressionNode): expression is EmptyNode {
		return expression instanceof EmptyNode;
	}
	protected isThisProperty(expression: ExpressionNode): boolean {
		if (this.isProperty(expression)) {
			if (expression.getLeft() === ThisNode || expression.getLeft().toString() === 'this') {
				return true;
			}
		}
		return false;
	}
	protected isValidReferenceExpression(expression: ExpressionNode): boolean {
		return this.isAssignableIdentifier(expression) || this.isProperty(expression);
	}
}

export class JavaScriptParser extends AbstractParser {
	static parse(app: string) {
		const stream = TokenStream.getTokenStream(app);
		const parser = new JavaScriptParser(stream);
		return parser.scan();
	}
	scan(): ExpressionNode {
		const list: ExpressionNode[] = [];
		let expression: ExpressionNode;
		while (this.peek().isNotType(Token.EOS)) {
			expression = this.parseStatement();
			if (EmptyNode.INSTANCE !== expression) {
				list.push(expression);
			}
		}
		if (list.length === 1) {
			return list[0];
		}
		return new StatementNode(list);
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
				return EmptyNode.INSTANCE;
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
			// case Token.TRY: {
			// 	// It is somewhat complicated to have label on try-statements.
			// 	// When breaking out of a try-finally statement, one must take
			// 	// great care not to treat it as a fall-through. It is much easier
			// 	// just to wrap the entire try-statement in a statement block and
			// 	// put the label there.
			// 	if (label == nullptr) return this.parseTryStatement();
			// 	StatementListT statements(pointer_buffer());
			// 	BlockT result = factory() -> NewBlock(false, true);
			// 	Target target(this, result, label, nullptr,
			// 		Target.TARGET_FOR_NAMED_ONLY);
			// 	StatementT statement = ParseTryStatement();
			// 	statements.Add(statement);
			// 	result -> InitializeStatements(statements, zone());
			// 	return result;
			// }

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
			// case Token.DEBUGGER:
			// 	return this.parseDebuggerStatement();
			// case Token.VAR:
			case Token.LET:
			case Token.CONST:
				return this.parseVariableDeclarations();
			case Token.ASYNC:
				if (this.peekAhead().isType(Token.FUNCTION)) {
					this.consume(Token.ASYNC);
					this.consume(Token.FUNCTION);
					if (this.peek().isType(Token.MUL)) {
						return this.parseFunctionExpression(FunctionType.ASYNC_GENERATOR);
					}
					return this.parseFunctionExpression(FunctionType.ASYNC);
				}
			default:
				return this.parseExpressionOrLabelledStatement();
		}
	}
	protected parseBlock(): ExpressionNode {
		const statements: ExpressionNode[] = [];
		const block = new BlockNode(statements)
		while (this.peek().isNotType(Token.R_CURLY)) {
			const stat = this.parseStatementListItem();
			if (!stat) {
				return block;
			} else if (stat instanceof EmptyNode) {
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
					return this.parseFunctionExpression(FunctionType.GENERATOR);
				}
				return this.parseFunctionExpression(FunctionType.NORMAL);
			case Token.CLASS:
				this.consume(Token.CLASS);
				// return this.parseClassDeclaration();
				throw new Error(`Parsing Error: 'class': not supported now`);
			// case Token.VAR:
			case Token.LET:
			case Token.CONST:
				return this.parseVariableDeclarations();
			// case Token.LET:
			// 	if (this.peekAhead().isNextLetKeyword()) {
			// 		return this.parseVariableDeclarations();
			// 	}
			// 	break;
			case Token.ASYNC:
				if (this.peekAhead().isType(Token.FUNCTION)) {
					this.consume(Token.ASYNC);
					if (this.peek().isType(Token.MUL)) {
						this.consume(Token.MUL);
						return this.parseFunctionExpression(FunctionType.ASYNC_GENERATOR);
					}
					return this.parseFunctionExpression(FunctionType.ASYNC);
				}
				break;
			default:
				break;
		}
		return this.parseStatement();
	}
	protected parseFunctionExpression(type: FunctionType): ExpressionNode {
		let funcName: ExpressionNode | undefined;
		const peek = this.peek();
		if (peek.isNotType(Token.L_PARENTHESES)) {
			if (peek.isType(Token.L_BRACKETS)) {
				// [Symbol.iterator]() {}
				this.consume(Token.L_BRACKETS);
				funcName = this.parseMemberExpression();
				this.expect(Token.R_BRACKETS);
			} else {
				funcName = this.parsePrimaryExpression();
			}
		}
		return this.parseFunctionLiteral(type, funcName);
	}
	protected parseIfStatement(): ExpressionNode {
		this.consume(Token.L_PARENTHESES);
		const condition = this.parseExpressionOrLabelledStatement();
		this.consume(Token.R_PARENTHESES);
		if (this.peek().isNotType(Token.L_CURLY)) {
			throw new Error(`expected '{'`);
		}
		const thenStatement = this.parseStatement();
		let elseStatement;
		if (this.peek().isType(Token.ELSE)) {
			this.consume(Token.ELSE);
			elseStatement = this.parseStatement();
		}
		return new IfElseNode(condition, thenStatement, elseStatement);
	}
	protected parseDoWhileStatement(): ExpressionNode {
		// DoStatement ::
		//   'do' Statement 'while' '(' Expression ')' ';'
		this.consume(Token.DO);
		const body = this.parseStatement();
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
		return new WhileNode(condition, body);
	}
	protected parseThrowStatement(): ExpressionNode {
		// ThrowStatement ::
		//   'throw' Expression ';'
		this.consume(Token.THROW);
		const exception = this.parseExpression();
		this.expect(Token.SEMICOLON);
		return new ThrowExpressionNode(exception);
	}
	protected parseSwitchStatement(): ExpressionNode {
		// SwitchStatement ::
		//   'switch' '(' Expression ')' '{' CaseClause* '}'
		// CaseClause ::
		//   'case' Expression ':' StatementList
		//   'default' ':' StatementList
		const switch_pos = this.peekPosition();

		this.consume(Token.SWITCH);
		this.expect(Token.L_PARENTHESES);
		const tag = this.parseExpression();
		this.expect(Token.R_PARENTHESES);

		const cases: CaseExpression[] = [];
		const switchStatement = new SwitchNode(tag, cases);

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
					throw new Error(`Error: Multiple Defaults In Switch`);
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
			const block = new BlockNode(statements);
			const clause = defaultSeen ? new DefaultExpression(block) : new CaseExpression(label!, block);
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
		const startsWithLet = this.peek().isType(Token.LET);
		let initializer: ExpressionNode;
		if (this.peek().isType(Token.CONST) || (startsWithLet && this.isNextLetKeyword())) {
			initializer = this.parseVariableDeclarations();
		} else {
			initializer = this.parseExpression();
		}
		const forMode = this.checkInOrOf();
		if (forMode) {
			const object = this.parseExpression();
			this.expect(Token.R_PARENTHESES)
			const statement = this.parseBlock();
			if (isAwait && forMode === 'OF') {
				return new ForAwaitOfNode(initializer, object, statement);
			} else if (forMode === 'OF') {
				return new ForOfNode(initializer, object, statement);
			} else if (forMode === 'IN') {
				return new ForInNode(initializer, object, statement);
			} else {
				throw new Error(`Error: parsing for loop: ${this.position()}`);
			}
		}
		this.expect(Token.SEMICOLON);
		const condition = this.parseExpression();
		this.expect(Token.SEMICOLON);
		const finalExpression = this.parseExpression();
		this.expect(Token.R_PARENTHESES);
		const statement = this.parseBlock();
		return new ForNode(statement, initializer, condition, finalExpression);
	}
	protected parseVariableDeclarations(): ExpressionNode {
		// VariableDeclarations ::
		//   ('var' | 'const' | 'let') (Identifier ('=' AssignmentExpression)?)+[',']
		// var converted into ==> let by parser

		let mode: 'const' | 'let';
		switch (this.peek().token) {
			case Token.CONST:
				this.consume(Token.CONST);
				mode = 'const';
				break;
			default:
			case Token.LET:
				this.consume(Token.LET);
				mode = 'let';
				break;
		}
		const variables: Variable[] = [];
		do {

			let name: ExpressionNode;
			let value: ExpressionNode | undefined;
			// Check for an identifier first, so that we can elide the pattern in cases
			// where there is no initializer (and so no proxy needs to be created).
			if (Token.isAnyIdentifier(this.peek().token)) {
				name = this.parseAndClassifyIdentifier(this.next());
				if (this.isEvalOrArguments(name)) {
					throw new Error(`Error: Strict Eval Arguments`);
				}
				if (this.peekInOrOf()) {
					break;
					// // Assignments need the variable expression for the assignment LHS, and
					// // for of/in will need it later, so create the expression now.
				}
			} else {
				name = this.parseBindingPattern();
			}

			if (this.check(Token.ASSIGN)) {
				value = this.parseAssignmentExpression();
			} else if (!this.peekInOrOf()) {
				// ES6 'const' and binding patterns require initializers.
				if (mode === 'const' && (name === undefined || value === undefined)) {
					throw new Error(`Error: Declaration Missing Initializer : ${this.position()}`);
				}
				// value = undefined;
			}
			variables.push(new Variable(name, value));
		} while (this.check(Token.COMMA));

		if (mode === 'const') {
			return new ConstNode(variables);
		} else {
			return new LetNode(variables);
		}
	}
	protected parseBindingPattern(): ExpressionNode {
		// Pattern ::
		//   Identifier
		//   ArrayLiteral
		//   ObjectLiteral

		const token = this.peek().token;
		if (Token.isAnyIdentifier(token)) {
			const name = this.parseAndClassifyIdentifier(this.next());
			if (this.isEvalOrArguments(name)) {
				throw new Error(`Syntax Error: Strict Eval Arguments`);
			}
			return name;
		}
		if (token == Token.L_BRACKETS) {
			return this.parseArrayLiteral();
		} else if (token == Token.L_CURLY) {
			return this.parseObjectLiteral();
		} else {
			throw new Error(`Syntax Error: Unexpected Token ${this.next().getValue().toString()}`);
		}
	}
	protected parseAndClassifyIdentifier(next: TokenExpression): ExpressionNode {
		if (next.isType(Token.IDENTIFIER)) {
			return next.getValue();
		}
		else if ('set' === next.getValue().toString()) {
			const value = this.parseFunctionDeclaration();
			return new SetPropertyNode(next.getValue(), value);
		}
		else if ('get' === next.getValue().toString()) {
			const value = this.parseFunctionDeclaration();
			return new GetPropertyNode(next.getValue(), value);
		}
		else if (next.isType(Token.AWAIT)) {
			throw new Error(`Parsing Error: un supported expression (await)`);

		}
		return next.getValue();
	}
	getIdentifier() {
		throw new Error('Method not implemented.');
	}
	protected parseContinueStatement(): ExpressionNode {
		// ContinueStatement ::
		//   'continue' ';'
		// Identifier? is not supported

		const pos = this.peekPosition();
		this.consume(Token.CONTINUE);
		this.expect(Token.SEMICOLON);
		return TerminateNode.CONTINUE_INSTANCE;
	}
	protected parseBreakStatement(): ExpressionNode {
		// BreakStatement ::
		//   'break' ';'
		// Identifier? is not supported

		const pos = this.peekPosition();
		this.consume(Token.BREAK);
		this.expect(Token.SEMICOLON);
		return TerminateNode.BREAK_INSTANCE;
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
		if (Token.isAutoSemicolon(tokenExp.token)) {
			// check if this scope is belong to 'constructor' method to return this at the end;
			// if (this.isDerivedConstructor(function_state_ -> kind())) {
			// 	returnValue = ThisNode;
			// }
		} else {
			returnValue = this.parseExpression();
		}
		this.expect(Token.SEMICOLON);
		return new ReturnNode(returnValue);
	}
	protected parseExpressionOrLabelledStatement(): ExpressionNode {
		// ExpressionStatement | LabelledStatement ::
		//   Expression ';'
		//   Identifier ':' Statement
		//
		// ExpressionStatement[Yield] :
		//   [lookahead notin {{, function, class, let [}] Expression[In, ?Yield] ;

		// int pos = peek_position();

		switch (this.peek().token) {
			case Token.FUNCTION:
			case Token.L_CURLY:
				throw new Error(`Parsing Error: Unreachable state`);
			case Token.CLASS:
				throw new Error(`Parsing Error: Unexpected Token ${this.next().getValue().toString()}`);
			case Token.LET: {
				const nextNext = this.peekAhead();
				// "let" followed by either "[", "{" or an identifier means a lexical
				// declaration, which should not appear here.
				// However, ASI may insert a line break before an identifier or a brace.
				if (nextNext.isNotType(Token.L_BRACKETS) &&
					((nextNext.isNotType(Token.L_CURLY) && nextNext.isNotType(Token.IDENTIFIER)))) {
					break;
				}
				throw new Error(`Parsing Error: Unexpected Lexical Declaration ${this.position()}`);
			}
			default:
				break;
		}

		// bool starts_with_identifier = peek_any_identifier();
		const startsWithIdentifier = Token.isAnyIdentifier(this.peek().token);

		// ExpressionT expr;
		// {
		// Effectively inlines ParseExpression, so potential labels can be extracted
		// from expression_scope.
		// ExpressionParsingScope expression_scope(impl());
		// AcceptINScope scope(this, true);
		const expr: ExpressionNode = this.parseExpressionCoverGrammar();
		// expression_scope.ValidateExpression();

		if (this.peek().isType(Token.COLON) && startsWithIdentifier && this.isIdentifier(expr)) {
			// The whole expression was a single identifier, and not, e.g.,
			// something starting with an identifier or a parenthesized identifier.

			// DCHECK_EQ(expression_scope.variable_list() -> length(), 1);
			// VariableProxy * label = expression_scope.variable_list() -> at(0).first;
			// impl() -> DeclareLabel(& labels, & own_labels, label -> raw_name());

			// Remove the "ghost" variable that turned out to be a label from the top
			// scope. This way, we don't try to resolve it during the scope
			// processing.
			// this -> scope() -> DeleteUnresolved(label);

			this.consume(Token.COLON);
			// ES#sec-labelled-function-declarations Labelled Function Declarations
			if (this.peek().isType(Token.FUNCTION) /*&& allow_function == kAllowLabelledFunctionStatement */) {
				return this.parseFunctionDeclaration();
			}
			return this.parseStatement();
		}
		// Parsed expression statement, followed by semicolon.
		this.consume(Token.SEMICOLON);
		// if (expr -> IsFailureExpression()) return impl() -> NullStatement();
		// return factory() -> NewExpressionStatement(expr, pos);
		return new NewNode(expr);
	}
	protected parseExpression(): ExpressionNode {
		return this.parseExpressionCoverGrammar();
	}
	protected parseFunctionDeclaration(): ExpressionNode {
		this.consume(Token.FUNCTION);
		if (this.check(Token.MUL)) {
			throw new Error(`Error Generator In Single Statement Context`);
		}
		return this.parseHoistableDeclaration(FunctionType.NORMAL);
	}
	protected ParseHoistableDeclarationAndGenerator() {
		this.consume(Token.FUNCTION);
		if (this.check(Token.MUL)) {
			return this.parseHoistableDeclaration(FunctionType.GENERATOR);
		}
		return this.parseHoistableDeclaration(FunctionType.NORMAL);
	}
	protected parseHoistableDeclaration(flag: FunctionType): ExpressionNode {
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

		if (FunctionType.ASYNC === flag && this.check(Token.MUL)) {
			// Async generator
			flag = FunctionType.ASYNC_GENERATOR;
		}
		let name: ExpressionNode | undefined;
		if (this.peek().isNotType(Token.L_PARENTHESES)) {
			name = this.parseIdentifier();
		}
		return this.parseFunctionLiteral(flag, name);
	}
	protected parseIdentifier(): ExpressionNode | undefined {
		const peek = this.peek();
		if (peek.getValue() instanceof IdentifierNode) {
			return this.next().getValue();
		}
		return void 0;
	}
	protected parseFunctionLiteral(flag: FunctionType, name?: ExpressionNode): ExpressionNode {
		// Function ::
		//   '(' FormalParameterList? ')' '{' FunctionBody '}'

		this.expect(Token.L_PARENTHESES);
		const formals: ExpressionNode[] = this.parseFormalParameterList();
		this.expect(Token.R_PARENTHESES);
		this.expect(Token.L_CURLY);
		const body: ExpressionNode = this.parseFunctionBody();
		this.expect(Token.R_CURLY);
		return new FunctionDeclarationNode(formals, body, flag, name);
	}
	protected parseFunctionBody(): ExpressionNode {
		const isExpression = this.peek().isNotType(Token.L_CURLY);
		let expression: ExpressionNode;
		if (isExpression) {
			expression = this.parseAssignmentExpression();
		} else {
			this.expect(Token.L_CURLY);
			const list = this.parseStatementList(Token.R_CURLY);
			this.expect(Token.R_CURLY);
			expression = new BlockNode(list);
		}
		return expression;
	}
	protected parseStatementList(endToken: Token): ExpressionNode[] {
		// StatementList ::
		//   (StatementListItem)* <end_token>
		const list: ExpressionNode[] = [];
		while (this.peek().isNotType(endToken)) {
			const stat = this.parseStatementListItem();
			if (!stat || this.isEmptyStatement(stat)) {
				break;
			}
			if (this.isEmptyStatement(stat)) {
				break;
			}
			list.push(stat);
		}
		return list;
	}
	protected parseFormalParameterList(): ExpressionNode[] {
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
				// const hasRest = this.check(Token.ELLIPSIS);
				const param: ExpressionNode = this.parseFormalParameter();
				parameters.push(param);
				if (param instanceof RestParameterNode) {
					if (this.peek().isType(Token.COMMA)) {
						throw new Error(`Parsing Error: Param After Rest @${this.position()}`);
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
	protected parseFormalParameter(): ExpressionNode {
		// FormalParameter[Yield,GeneratorParameter] :
		//   BindingElement[?Yield, ?GeneratorParameter]
		const hasRest = this.check(Token.ELLIPSIS);
		let pattern = this.parseBindingPattern();
		let initializer: ParamterNode;
		if (this.check(Token.ASSIGN)) {
			if (hasRest) {
				throw new Error(`Parsing Error: Rest Default Initializer`);
			}
			const value = this.parseAssignmentExpression();
			initializer = new ParamterNode(pattern, value);
		} else {
			if (hasRest && pattern instanceof IdentifierNode) {
				pattern = new RestParameterNode((pattern).getProperty() as string);
			}
			initializer = new ParamterNode(pattern);
		}
		return initializer;
	}
	protected parseExpressionCoverGrammar(): ExpressionNode {
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
				return this.parseArrowParametersWithRest(list, variableIndex);
			}


			// int expr_pos = peek_position();
			expression = this.parseAssignmentExpressionCoverGrammar();
			// ClassifyArrowParameter(& accumulation_scope, expr_pos, expression);
			list.push(expression);

			// variableIndex = expression_scope() -> SetInitializers(variable_index, peek_position());

			if (!this.check(Token.COMMA)) break;

			if (this.peek().isType(Token.R_PARENTHESES) && this.peekAhead().isType(Token.ARROW)) {
				// a trailing comma is allowed at the end of an arrow parameter list
				break;
			}

			// Pass on the 'set_next_function_is_likely_called' flag if we have
			// several function literals separated by comma.
			// if (this.peek().isType(Token.FUNCTION) &&
			// 	function_state_ -> previous_function_was_likely_called()) {
			// 	function_state_ -> set_next_function_is_likely_called();
			// }
		}
		if (list.length == 1) return expression;
		return this.expressionListToExpression(list);
	}
	protected parseArrowParametersWithRest(list: ExpressionNode[], variableIndex: number): ExpressionNode {
		this.consume(Token.ELLIPSIS);

		// Scanner:: Location ellipsis = scanner() -> location();
		// int pattern_pos = peek_position();
		const pattern: ExpressionNode = this.parseBindingPattern();
		// ClassifyArrowParameter(accumulation_scope, pattern_pos, pattern);

		// expression_scope() -> RecordNonSimpleParameter();

		if (this.peek().isType(Token.ASSIGN)) {
			throw new Error(`Error A rest parameter cannot have an initializer`);
		}

		const spread = new SpreadSyntaxNode(pattern);

		// ExpressionT spread = factory() -> NewSpread(pattern, ellipsis.beg_pos, pattern_pos);
		if (this.peek().isType(Token.COMMA)) {
			throw new Error(`Error A rest parameter or binding pattern may not have a trailing comma`);
		}

		// expression_scope() -> SetInitializers(seen_variables, peek_position());

		// 'x, y, ...z' in CoverParenthesizedExpressionAndArrowParameterList only
		// as the formal parameters of'(x, y, ...z) => foo', and is not itself a
		// valid expression.
		if (this.peek().isNotType(Token.R_PARENTHESES) || this.peekAhead().isNotType(Token.ARROW)) {
			throw new Error(`Error Unexpected Token At ${this.position()}`);
		}

		list.push(spread);
		return this.expressionListToExpression(list);
	}
	protected expressionListToExpression(list: ExpressionNode[]): ExpressionNode {
		if (list.length === 1) { return list[0]; }
		return new CommaNode(list);
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

		// int beg_pos = peek_position();
		let token = this.scanner.peek();

		if (Token.isAnyIdentifier(token.token)) {
			return this.next().getValue();
		}

		if (Token.isLiteral(token.token)) {
			return this.next().getValue();
		}

		switch (token.token) {
			case Token.NEW: {
				return this.parseMemberWithPresentNewPrefixesExpression();
			}
			case Token.THIS: {
				this.consume(Token.THIS);
				return ThisNode;
			}

			case Token.REGEXP_LITERAL:
				return token.value!;

			case Token.FUNCTION:
				this.consume(Token.FUNCTION);
				if (this.peek().isType(Token.MUL)) {
					this.consume(Token.MUL);
					return this.parseFunctionExpression(FunctionType.GENERATOR);
				}
				return this.parseFunctionExpression(FunctionType.NORMAL);
			case Token.SUPER: {
				return this.parseSuperExpression();
			}
			case Token.IMPORT:
				return this.parseImportExpressions();

			case Token.L_BRACKETS:
				return this.parseArrayLiteral();

			case Token.L_CURLY:
				return this.parseObjectLiteral();

			case Token.L_PARENTHESES: {
				this.consume(Token.L_PARENTHESES);
				if (this.check(Token.R_PARENTHESES)) {
					// ()=>x.  The continuation that consumes the => is in
					// ParseAssignmentExpressionCoverGrammar.
					// if (!this.peekAhead().isType(Token.ARROW)) {
					// 	throw new Error(`Unexpected Token: ${Token.R_PARENTHESES}`);
					// }
					// next_arrow_function_info_.scope =
					// 	NewFunctionScope(FunctionKind.kArrowFunction);
					// return factory() -> NewEmptyParentheses(beg_pos);
				}
				// Scope.Snapshot scope_snapshot(scope());
				// ArrowHeadParsingScope maybe_arrow(impl(), FunctionKind.kArrowFunction);
				// // Heuristically try to detect immediately called functions before
				// // seeing the call parentheses.
				// if (this.peekAhead().isType(Token.FUNCTION) ||
				// 	(this.peekAhead().isType(Token.ASYNC) && this.peekAhead().isType(Token.FUNCTION))) {
				// 	function_state_ -> set_next_function_is_likely_called();
				// }
				// AcceptINScope scope(this, true);
				// ExpressionT expr = ParseExpressionCoverGrammar();
				// expr -> mark_parenthesized();
				// this.expect(Token.RPAREN);

				// if (this.peekAhead().isType(Token.ARROW)) {
				// 	next_arrow_function_info_.scope = maybe_arrow.ValidateAndCreateScope();
				// 	scope_snapshot.Reparent(next_arrow_function_info_.scope);
				// } else {
				// 	maybe_arrow.ValidateExpression();
				// }

				// return expr;
				break;
			}
			case Token.CLASS: {
				throw new Error(`not supported`);
			}

			// case Token.TEMPLATE_SPAN:
			// case Token.TEMPLATE_TAIL:
			// 	throw new Error(`not supported`);
			default:
				break;
		}
		throw new Error(`Unexpected Token: ${JSON.stringify(this.next())}`);
	}
	protected parseMemberWithPresentNewPrefixesExpression(): ExpressionNode {
		this.consume(Token.NEW);
		const newPos = this.scanner.getPos();
		let classRef: ExpressionNode;


		if (this.peek().isType(Token.IMPORT) && this.peekAhead().isType(Token.L_PARENTHESES)) {
			throw new Error(`Error: parsing new import ( at position ${newPos}`);
		} else if (this.peek().isType(Token.SUPER)) {
			throw new Error(`Error: parsing new super() is never allowed at position ${newPos}`);
		} else if (this.peek().isType(Token.PERIOD)) {
			classRef = this.parseNewTargetExpression();
			return this.parseMemberExpressionContinuation(classRef);
		} else {
			classRef = this.parseMemberExpression();
		}
		if (this.peek().isType(Token.L_PARENTHESES)) {
			// NewExpression with arguments.

			const args: ExpressionNode[] = this.parseFormalParameterList();
			classRef = new NewNode(classRef, args);

			// The expression can still continue with . or [ after the arguments.
			return this.parseMemberExpressionContinuation(classRef);
		}

		if (this.peek().isType(Token.QUESTION_PERIOD)) {
			throw new Error(`Error: parsing new xxx?.yyy at position ${newPos}`);
		}

		// NewExpression without arguments.
		return new NewNode(classRef);
	}
	protected parseArguments(maybeArrow?: ParsingArrowHeadFlag): ExpressionNode[] {
		// Arguments ::
		//   '(' (AssignmentExpression)*[','] ')'

		let hasSpread = false;
		this.consume(Token.L_PARENTHESES);
		const args: ExpressionNode[] = [];
		while (this.peek().isNotType(Token.R_PARENTHESES)) {
			const isSpread = this.check(Token.ELLIPSIS);
			let argument: ExpressionNode = this.parseAssignmentExpressionCoverGrammar();
			if (ParsingArrowHeadFlag.MaybeArrowHead === maybeArrow) {
				if (isSpread) {
					if (argument instanceof AssignmentNode) {
						throw new Error(` Rest parameter may not have a default initializer'`);
					}
					if (this.peek().isType(Token.COMMA)) {
						throw new Error(`Error: parsing '...spread,arg =>'`);
					}
				}
			}
			if (isSpread) {
				hasSpread = true;
				argument = new SpreadSyntaxNode(argument);
			}
			args.push(argument);
			if (!this.check(Token.COMMA)) break;
		}
		if (!this.check(Token.R_PARENTHESES)) {
			throw new Error(`Error: parsing arguments call, expecting ')'`);
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
		if (op == Token.ARROW) {
			if (!this.isIdentifier(expression) && !this.isParenthesized(expression)) {
				throw new Error(`Error: Malformed Arrow Fun Param List`);
			}
			expression = this.parseArrowFunctionLiteral([new ParamterNode(expression)], ArrowFunctionType.NORMAL);
			return expression;
		}
		if (this.isAssignableIdentifier(expression)) {
			if (this.isParenthesized(expression.getLeft())) {
				throw new Error(`Error: Invalid Destructuring Target`);
			}
		} else if (this.isProperty(expression)) {
			throw new Error(`Error: Invalid Property Binding Pattern`);
		} else if (this.isPattern(expression) && Token.isAssignment(op)) {
			// Destructuring assignment.
			if (this.isParenthesized(expression)) {
				// Scanner:: Location loc(lhs_beg_pos, end_position());
				// if (expression_scope() -> IsCertainlyDeclaration()) {
				// 	impl() -> ReportMessageAt(loc,
				// 		MessageTemplate:: kInvalidDestructuringTarget);
				// } else {
				// 	// Syntax Error if LHS is neither object literal nor an array literal
				// 	// (Parenthesized literals are
				// 	// CoverParenthesizedExpressionAndArrowParameterList).
				// 	// #sec-assignment-operators-static-semantics-early-errors
				// 	impl() -> ReportMessageAt(loc, MessageTemplate:: kInvalidLhsInAssignment);
				// }
			}
			// expression_scope() -> ValidateAsPattern(expression, lhs_beg_pos, end_position());
		} else {
			if (!this.isValidReferenceExpression(expression)) {
				throw new Error(`Error: Invalid Reference Expression`);
			}
			if (Token.isLogicalAssignmentOp(op)) {
				throw new Error(`Error: Invalid Lhs In Assignment`);
			}
		}

		this.consume(op);
		// const opPosition = this.position();
		const right: ExpressionNode = this.parseAssignmentExpression();
		// Anonymous function name inference applies to =, ||=, &&=, and ??=.
		// if (Token.isAssignment(op) || Token.isLogicalAssignmentOp(op)) {
		// 	// impl() -> CheckAssigningFunctionLiteralToProperty(expression, right);

		// 	// Check if the right hand side is a call to avoid inferring a
		// 	// name if we're dealing with "a = function(){...}();"-like
		// 	// expression.
		// 	// if (this.isCall(right) || this.isCallNew(right)) {
		// 	// 	fni_.RemoveLastFunction();
		// 	// } else {
		// 	// 	fni_.Infer();
		// 	// }

		// 	// impl() -> SetFunctionNameFromIdentifierRef(right, expression);
		// } else {
		// 	// fni_.RemoveLastFunction();
		// }

		if (!Token.isAssignment(op)) {
			throw new Error(`Error: Invalid Destructuring Target`);
		}
		// if (Token.isAssignment(op)) {
		// 	// We try to estimate the set of properties set by constructors. We define a
		// 	// new property whenever there is an assignment to a property of 'this'. We
		// 	// should probably only add properties if we haven't seen them before.
		// 	// Otherwise we'll probably overestimate the number of properties.
		// 	if (this.isThisProperty(expression)) {
		// 		function_state_ -> AddProperty();
		// 	}
		// } else {
		// 	// Only initializers (i.e. no compound assignments) are allowed in patterns.
		// 	throw new Error(`Error: Invalid Destructuring Target`);
		// }
		return new AssignmentNode(op.jsToken(), expression, right);
	}
	protected parseAssignmentExpression(): ExpressionNode {
		return this.parseAssignmentExpressionCoverGrammar();
	}
	protected parseArrowFunctionLiteral(parameters: ExpressionNode[], flag: ArrowFunctionType): ExpressionNode {
		this.consume(Token.ARROW);
		const body = this.parseFunctionBody();
		return new ArrowFunctionNode(parameters, body, flag);
	}
	protected parseNewTargetExpression(): ExpressionNode {
		throw new Error('Expression (new.target) not supported.');
	}
	protected parseRegExpLiteral(): ExpressionNode | undefined {
		const value = this.peek().getValue();
		if (value instanceof RegExpNode) {
			return this.next().getValue();
		}
	}
	protected parseSuperExpression(): ExpressionNode {
		throw new Error('Expression (supper) not supported.');
	}
	protected parseImportExpressions(): ExpressionNode {
		throw new Error('Expression (import) not supported.');
	}
	protected parseArrayLiteral(): ExpressionNode {
		// ArrayLiteral ::
		//   '[' Expression? (',' Expression?)* ']'

		this.consume(Token.L_BRACKETS);
		const values: ExpressionNode[] = [];
		let firstSpreadIndex = -1;

		while (!this.check(Token.R_BRACKETS)) {
			let elem: ExpressionNode;
			if (this.peek().isType(Token.COMMA)) {
				continue;
			} else if (this.check(Token.ELLIPSIS)) {
				// int start_pos = position();
				// int expr_pos = peek_position();
				// AcceptINScope scope(this, true);
				const argument: ExpressionNode = this.parsePossibleDestructuringSubPattern();
				// elem = factory() -> NewSpread(argument, start_pos, expr_pos);
				elem = new SpreadSyntaxNode(argument);

				if (firstSpreadIndex < 0) {
					firstSpreadIndex = values.length;
				}

				// if (argument -> IsAssignment()) {
				// 	expression_scope() -> RecordPatternError(
				// 		Scanner:: Location(start_pos, end_position()),
				// 		MessageTemplate:: kInvalidDestructuringTarget);
				// }

				if (this.peek().isType(Token.COMMA)) {
					throw new Error(`Parsing Error: Element After Rest @${this.position()}`);
				}
			} else {
				elem = this.parsePossibleDestructuringSubPattern();
			}
			values.push(elem);
		}

		return new ArrayLiteralNode(values);
	}
	protected parsePossibleDestructuringSubPattern(): ExpressionNode {
		// if (scope) scope -> Accumulate();
		// int begin = peek_position();
		const result = this.parseAssignmentExpressionCoverGrammar();

		// if (IsValidReferenceExpression(result)) {
		// 	// Parenthesized identifiers and property references are allowed as part of
		// 	// a larger assignment pattern, even though parenthesized patterns
		// 	// themselves are not allowed, e.g., "[(x)] = []". Only accumulate
		// 	// assignment pattern errors if the parsed expression is more complex.
		// 	if (impl() -> IsIdentifier(result)) {
		// 		if (result -> is_parenthesized()) {
		// 			expression_scope() -> RecordDeclarationError(
		// 				Scanner:: Location(begin, end_position()),
		// 				MessageTemplate:: kInvalidDestructuringTarget);
		// 		}
		// 		IdentifierT identifier = impl() -> AsIdentifier(result);
		// 		ClassifyParameter(identifier, begin, end_position());
		// 	} else {
		// 		DCHECK(result -> IsProperty());
		// 		expression_scope() -> RecordDeclarationError(
		// 			Scanner:: Location(begin, end_position()),
		// 			MessageTemplate:: kInvalidPropertyBindingPattern);
		// 		if (scope != nullptr) scope -> ValidateExpression();
		// 	}
		// } else if (result -> is_parenthesized() ||
		// 	(!result -> IsPattern() && !result -> IsAssignment())) {
		// 	expression_scope() -> RecordPatternError(
		// 		Scanner:: Location(begin, end_position()),
		// 		MessageTemplate:: kInvalidDestructuringTarget);
		// }

		return result;
	}
	protected parseObjectLiteral(): ExpressionNode {
		// ObjectLiteral ::
		// '{' (PropertyDefinition (',' PropertyDefinition)* ','? )? '}'

		this.consume(Token.L_CURLY);
		const properties: ExpressionNode[] = [];
		while (!this.check(Token.R_CURLY)) {
			const property: ExpressionNode = this.parseObjectPropertyDefinition();
			properties.push(property);

			if (this.peek().isNotType(Token.R_CURLY)) {
				this.expect(Token.COMMA);
			}
		}
		return new ObjectLiteralNode(properties);
	}
	protected parseObjectPropertyDefinition(): ExpressionNode {
		const nextValue = this.peek().getValue().toString();
		const property: ExpressionNode = this.parseProperty();

		// DCHECK_IMPLIES(name_token == Token.PRIVATE_NAME, has_error());

		// IdentifierT name = propInfo.name;
		// ParseFunctionFlags function_flags = propInfo.function_flags;
		// ParsePropertyKind kind = propInfo.kind;

		if (nextValue === '...' && property instanceof SpreadSyntaxNode) {
			// spread
			return new ObjectLiteralPropertyNode(property.getNode(), property);
		} else if (nextValue === '...' && property instanceof IdentifierNode) {
			// spread
			return new ObjectLiteralPropertyNode(property, new SpreadSyntaxNode(property));
		} else if (property instanceof IdentifierNode) {
			if (this.peek().isType(Token.COMMA) || this.peek().isType(Token.R_CURLY)) {
				// shorthand
				return new ObjectLiteralPropertyNode(property, property);
			} else if (this.peek().isType(Token.COLON)) {
				// computed
				this.consume(Token.COLON);
				const value = this.parsePrimaryExpression();
				return new ObjectLiteralPropertyNode(property, value);
			}
		} else if (property instanceof FunctionDeclarationNode) {
			if (nextValue === 'set') {
				// set
				return new SetPropertyNode(property.getName()!, property);
			} else if (nextValue === 'get') {
				// get
				return new GetPropertyNode(property.getName()!, property);
			} else {
				// method
				return new ObjectLiteralPropertyNode(property.getName()!, property);
			}
		} else if (property instanceof ObjectLiteralPropertyNode) {
			return property;
		}
		throw new Error(`Parsing Error: Unexpected Token @${this.position()}`);
	}
	protected parseProperty(): ExpressionNode {
		const nextToken = this.peek();
		const nextValue = nextToken.value?.toString();
		if (nextValue === 'set' || nextValue === 'get') {
			return this.parseFunctionExpression(FunctionType.NORMAL);
		}
		switch (nextToken.token) {
			case Token.ASYNC:
				this.consume(Token.ASYNC);
				const peek = this.peek();
				if (peek.isType(Token.MUL)) {
					return this.parseFunctionExpression(FunctionType.ASYNC_GENERATOR);
				}
				return this.parseFunctionExpression(FunctionType.ASYNC);

			case Token.L_BRACKETS:
				return this.parseFunctionExpression(FunctionType.NORMAL);

			case Token.IDENTIFIER:
				this.consume(Token.IDENTIFIER);
				if (this.check(Token.COLON)) {
					const value = this.parsePrimaryExpression();
					return new ObjectLiteralPropertyNode(nextToken.getValue(), value);
				}
				return nextToken.getValue();
			case Token.STRING:
			case Token.NUMBER:
			case Token.BIGINT:
				this.consume(nextToken.token);
				this.expect(Token.COLON);
				const value = this.parsePrimaryExpression();
				return new ObjectLiteralPropertyNode(nextToken.getValue(), value);
			case Token.ELLIPSIS:
				this.consume(Token.ELLIPSIS);
				const expression = this.parsePossibleDestructuringSubPattern();
				if (!this.isValidReferenceExpression(expression)) {
					throw new Error(`Parsing Error: Invalid Rest Binding/Assignment Pattern`);
				}
				if (this.peek().isNotType(Token.R_CURLY)) {
					throw new Error(`Parsing Error: Element After Rest`);
				}
				return expression;
			default:
				return this.parsePropertyOrPrivatePropertyName();
		}
	}
	protected parseMemberExpressionContinuation(expression: ExpressionNode): ExpressionNode {
		if (!Token.isMember(this.peek().token)) return expression;
		return this.doParseMemberExpressionContinuation(expression);
	}
	protected doParseMemberExpressionContinuation(expression: ExpressionNode): ExpressionNode {
		if (!Token.isMember(this.peek().token)) {
			throw new Error(`Error: Parsing member expression`);
		}
		// Parses this part of MemberExpression:
		// ('[' Expression ']' | '.' Identifier | TemplateLiteral)*
		do {
			switch (this.peek().token) {
				case Token.L_BRACKETS: {
					this.consume(Token.L_BRACKETS);
					const index = this.parseExpressionCoverGrammar();
					expression = new ComputedMemberAccessNode(expression, index);
					this.expect(Token.R_BRACKETS);
					break;
				}
				case Token.PERIOD: {
					this.consume(Token.PERIOD);
					// int pos = peek_position();
					// ExpressionT key = ParsePropertyOrPrivatePropertyName();
					// expression = factory() -> NewProperty(expression, key, pos);
					const key: ExpressionNode = this.parsePropertyOrPrivatePropertyName();
					expression = new MemberAccessNode(expression, key);
					break;
				}
				default: {
					/* ES6 Template Literals */
					// parser need to handel
					// if (!Token.isTemplate(this.peek().token)) {
					// 	throw new Error(`Error: Parsing Template Literals ${this.position()}`);
					// }
					// if (expression -> IsFunctionLiteral()) {
					// 	// If the tag function looks like an IIFE, set_parenthesized() to
					// 	// force eager compilation.
					// 	expression -> AsFunctionLiteral() -> SetShouldEagerCompile();
					// }
					// expression = this.parseTemplateLiteral(expression, true);
					break;
				}
			}
		} while (Token.isMember(this.peek().token));
		return expression;
	}
	protected parsePropertyOrPrivatePropertyName(): ExpressionNode {
		const next = this.next();
		if (next.getValue() instanceof IdentifierNode) {
			return next.getValue();
		}
		throw new Error(`Error Parsing property expression: Unexpected Token`);
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

		this.expect(Token.PIPELINE);
		const func = this.parseExpression();
		let args: (ExpressionNode | '?')[] = [];
		switch (this.peek().token) {
			case Token.COLON:
				// support angular pipeline syntax
				do {
					this.consume(Token.COLON);
					if (this.peek().isType(Token.CONDITIONAL)) {
						this.consume(Token.CONDITIONAL);
						args.push('?');
					} else {
						args.push(this.parseExpression());
					}
				} while (this.peek().isType(Token.COLON));
				break;
			case Token.L_PARENTHESES:
				// es2020 syntax
				this.consume(Token.L_PARENTHESES);
				while (this.peek().isNotType(Token.R_PARENTHESES)) {
					if (this.peek().isType(Token.CONDITIONAL)) {
						this.consume(Token.CONDITIONAL);
						args.push('?');
					} else {
						args.push(this.parseExpression());
					}
				}
				break;
			default:
				break;
		}
		return new PipelineNode(expression, func, args);
	}
	protected parseConditionalExpression(): ExpressionNode {
		// ConditionalExpression ::
		//   LogicalExpression
		//   LogicalExpression '?' AssignmentExpression ':' AssignmentExpression
		//

		const expression: ExpressionNode = this.parseLogicalExpression();
		return this.peek().isType(Token.CONDITIONAL) ? this.parseConditionalContinuation(expression) : expression;
	}
	protected parseLogicalExpression(): ExpressionNode {
		// throw new Error('Method not implemented.');
		// LogicalExpression ::
		//   LogicalORExpression
		//   CoalesceExpression

		// Both LogicalORExpression and CoalesceExpression start with BitwiseOR.
		// Parse for binary expressions >= 6 (BitwiseOR);

		let expression: ExpressionNode = this.parseBinaryExpression(6);
		const peek = this.peek();
		if (peek.isType(Token.AND) || peek.isType(Token.OR)) {
			// LogicalORExpression, pickup parsing where we left off.
			const precedence = peek.token.jsPrecedence();
			expression = this.parseBinaryContinuation(expression, 4, precedence);
		} else if (peek.isType(Token.NULLISH)) {
			expression = this.parseNullishExpression(expression);
		}
		return expression;
	}
	protected parseBinaryContinuation(x: ExpressionNode, prec: number, prec1: number): ExpressionNode {
		do {
			// prec1 >= 4
			while (this.peek().token.jsPrecedence() === prec1) {
				// SourceRange right_range;
				// int pos = peek_position();
				let y: ExpressionNode;
				let op;

				// SourceRangeScope right_range_scope(scanner(), & right_range);
				op = this.next();

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
					let r = shortcutNumericLiteralBinaryExpression(x, y, cmp);
					if (r) {
						x = r;
					}

					if (op.isNotType(cmp)) {
						// The comparison was negated - add a NOT.
						r = buildUnaryExpression(x, Token.NOT);
						if (r) {
							x = r;
						}
					}
				} else {
					const r = shortcutNumericLiteralBinaryExpression(x, y, op.token);
					if (r) {
						x = r;

					}
				}
			}
			--prec1;
		} while (prec1 >= prec);

		return x;
	}
	protected parseBinaryExpression(precedence: number): ExpressionNode {
		// throw new Error('Method not implemented.');
		const x: ExpressionNode = this.parseUnaryExpression();

		const precedence1 = this.peek().token.jsPrecedence();
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
					throw new Error(`"delete identifier" is a syntax error in strict mode`);
				}
				if (expression instanceof AccessNode && expression.getRight().toString().startsWith('#')) {
					throw new Error(`"Delete Private Field" is a syntax error`);
				}
			}

			if (this.peek().isType(Token.EXP)) {
				throw new Error(`Unexpected Token Unary Exponentiation`);
			}
		}

		if (Token.isCount(op.token) || Token.isUnary(op.token)) {
			// Allow the parser to rewrite the expression.
			const unary = buildUnaryExpression(expression, op.token);
			if (unary) {
				return unary;
			}
		}
		throw new Error(`Parsing Error: while rewrite unary operation`);
	}
	protected parsePostfixExpression(): ExpressionNode {
		// PostfixExpression ::
		//   LeftHandSideExpression ('++' | '--')?

		// int lhs_beg_pos = peek_position();
		const expression: ExpressionNode = this.parseLeftHandSideExpression();
		if (!Token.isCount(this.peek().token)) {
			return expression;
		}
		return this.parsePostfixContinuation(expression);
	}
	protected parsePostfixContinuation(expression: ExpressionNode): ExpressionNode {
		if (!this.isValidReferenceExpression(expression)) {
			throw new Error(`Parsing Error: Invalid Lhs In Postfix Op.`);
		}
		const op = this.next();
		const postfix = buildPostfixExpression(expression, op.token);
		if (postfix) {
			return postfix;
		}
		throw new Error(`Parsing Error: while rewrite postfix operation`);
	}
	protected parseLeftHandSideExpression(): ExpressionNode {
		// LeftHandSideExpression ::
		//   (NewExpression | MemberExpression) ...

		const result = this.parseMemberExpression();
		if (!Token.isPropertyOrCall(this.peek().token)) return result;
		return this.parseLeftHandSideContinuation(result);
	}
	protected parseLeftHandSideContinuation(result: ExpressionNode): ExpressionNode {
		if (this.peek().isType(Token.L_PARENTHESES) && this.isIdentifier(result) &&
			this.scanner.currentToken().isType(Token.ASYNC)) {
			const args = this.parseArguments(ParsingArrowHeadFlag.AsyncArrowFunction);
			if (this.peek().isType(Token.ARROW)) {
				// fni_.RemoveAsyncKeywordFromEnd();
				// next_arrow_function_info_.scope = maybe_arrow.ValidateAndCreateScope();
				// scope_snapshot.Reparent(next_arrow_function_info_.scope);
				// async () => ...
				if (!args.length) return new EmptyNode;
				// async ( Arguments ) => ...
				return this.expressionListToExpression(args);
			}

			result = new FunctionCallNode(result, args);
			if (!Token.isPropertyOrCall(this.peek().token)) return result;
		}

		let optionalChaining = false;
		let isOptional = false;
		// let optionalLinkBegin;
		do {
			switch (this.peek().token) {
				case Token.QUESTION_PERIOD: {
					if (isOptional) {
						throw new Error(`Parsing Error: Failure Expression`);
					}
					// Include the ?. in the source range position.
					// optionalLinkBegin = scanner() -> peek_location().beg_pos;

					this.consume(Token.QUESTION_PERIOD);
					isOptional = true;
					optionalChaining = true;
					if (Token.isPropertyOrCall(this.peek().token)) continue;
					// int pos = position();
					const key = this.parsePropertyOrPrivatePropertyName();
					// result = factory() -> NewProperty(result, key, pos, isOptional);
					result = new OptionalChainingNode(result, key, 'property');
					break;
				}

				/* Property */
				case Token.L_BRACKETS: {
					this.consume(Token.L_BRACKETS);
					// int pos = position();
					// AcceptINScope scope(this, true);
					const index = this.parseExpressionCoverGrammar();
					// result = factory() -> NewProperty(result, index, pos, isOptional);
					result = new ComputedMemberAccessNode(result, index);
					this.expect(Token.R_BRACKETS);
					break;
				}

				/* Property */
				case Token.PERIOD: {
					if (isOptional) {
						throw new Error(`Parsing Error: Unexpected Token:${this.position()}`);
					}
					this.consume(Token.PERIOD);
					// int pos = position();
					const key = this.parsePropertyOrPrivatePropertyName();
					// result = factory() -> NewProperty(result, key, pos, isOptional);
					result = new MemberAccessNode(result, key);
					break;
				}

				/* Call */
				case Token.L_PARENTHESES: {
					const args = this.parseArguments();
					if (result.toString() === 'eval') {
						throw new Error(`'eval(...)' is not supported.`);
					}
					result = new FunctionCallNode(result, args);
					break;
				}

				default:
					// Template literals in/after an Optional Chain not supported:
					if (optionalChaining) {
						throw new Error(`Parsing Error: Optional Chaining No Template support`);
					}
					/* Tagged Template */
					// result = result;
					break;
			}
			if (isOptional) {
				// SourceRange chain_link_range(optionalLinkBegin, end_position());
				// impl() -> RecordExpressionSourceRange(result, chain_link_range);
				isOptional = false;
			}
		} while (Token.isPropertyOrCall(this.peek().token));
		return result;
	}
	protected parseAwaitExpression(): ExpressionNode {
		throw new Error(`'await' is not supported`);
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
			.reduce((previous, current) => new LogicalNode(Token.NULLISH.jsToken(), current, previous), expression);
		return expression;
	}
	protected parseConditionalContinuation(expression: ExpressionNode): ExpressionNode {
		this.consume(Token.CONDITIONAL);
		const left: ExpressionNode = this.parseAssignmentExpression();
		this.expect(Token.COLON);
		const right = this.parseAssignmentExpression();
		return new TernaryNode(expression, left, right);
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
				throw new Error(`Delegating yields require an RHS`);
			default:
				expression = this.parseAssignmentExpressionCoverGrammar();
				break;
		}
		// }

		throw new Error(`Error: Yield expression is not supported now.`);

		// if (delegating) {
		// 	return new YieldStarNode(expression!);
		// }

		// // Hackily disambiguate o from o.next and o [Symbol.iterator]().
		// // TODO(verwaest): Come up with a better solution.
		// return new YieldNode(expression!);
	}
}
