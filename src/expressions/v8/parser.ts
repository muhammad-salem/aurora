import type { ExpressionNode } from '../api/expression.js';
import { InlineParserOptions, JavaScriptInlineParser, PositionMark } from './inline.js';
import { Token, TokenExpression } from './token.js';
import {
	AccessorProperty,
	Class,
	ClassBody,
	ClassDeclaration,
	ClassExpression,
	MetaProperty,
	MethodDefinition,
	PropertyDefinition,
	StaticBlock,
	Super
} from '../api/class/class.js';
import { FunctionExpression } from '../api/definition/function.js';
import { Identifier, Literal } from '../api/definition/values.js';
import { AssignmentExpression } from '../api/operators/assignment.js';
import {
	VariableDeclarationNode,
	VariableDeclarator
} from '../api/statement/declarations/declares.js';
import { TokenStream } from './stream.js';
import { Program } from '../api/program.js';
import {
	ExportAllDeclaration,
	ExportDefaultDeclaration,
	ExportNamedDeclaration,
	ExportSpecifier
} from '../api/module/export.js';
import {
	ImportDeclaration,
	ImportDefaultSpecifier,
	ImportExpression,
	ImportNamespaceSpecifier,
	ImportSpecifier
} from '../api/module/import.js';
import { ImportAttribute, ModuleSpecifier } from '../api/module/common.js';
import {
	ClassInfo,
	ClassLiteralProperty,
	ClassLiteralPropertyKind,
	classPropertyKindFor,
	createClassInfo,
	FunctionKind,
	FunctionSyntaxKind,
	isAccessor,
	ParseFunctionFlag,
	PropertyKind,
	PropertyKindInfo,
	PropertyPosition,
	VariableDeclarationContext
} from './enums.js';

import { isStrict, LanguageMode, } from './language.js';
import type { NodeFactory } from './node.js';
import { ExpressionNodeFactory } from './factory.js';
import { WithStatement } from '../api/statement/control/with.js';

export type ParserOptions = { mode?: LanguageMode, factory?: NodeFactory };

export class JavaScriptParser extends JavaScriptInlineParser {
	/**
	 * parser js with
	 * @param source 
	 * @returns 
	 */
	static parse(source: string | TokenExpression[] | TokenStream, { mode, factory }: ParserOptions = {}): Program {
		mode ??= LanguageMode.Strict;
		const stream = (typeof source === 'string') || Array.isArray(source)
			? TokenStream.getTokenStream(source, mode) : source;
		factory ??= new ExpressionNodeFactory();
		const parser = new JavaScriptParser(stream, factory, false);
		return parser.scan();
	}

	/**
	 * parse inline code like that used in html 2 or 1 way binding
	 */
	static parseScript<T extends ExpressionNode>(source: string | TokenExpression[] | TokenStream, options?: InlineParserOptions): T {
		return JavaScriptInlineParser.parse(source, options) as T;
	}

	override scan(): Program {
		const range = this.createStartPosition();
		const isModule = isStrict(this.languageMode);
		if (isModule) {
			this.setFunctionKind(FunctionKind.Module);
		}
		const body = isModule ? this.parseModuleItemList() : this.parseStatementList(Token.EOS);
		this.updateRangeEnd(range);
		return this.factory.createProgram(isModule ? 'module' : 'script', body, range);
	}
	protected override parseNewTargetExpression(start?: PositionMark): ExpressionNode {
		this.consume(Token.PERIOD);
		const target: ExpressionNode = this.parsePropertyOrPrivatePropertyName();
		if (target.toString() !== 'target') {
			throw new Error(this.errorMessage(`Expression (new.${target.toString()}) not supported.`));
		}
		return this.factory.createMetaProperty(
			this.factory.createIdentifier('new', start?.range),
			this.factory.createIdentifier('target', target.range),
			this.createRange(start)
		);
	}
	protected override parseClassExpression(): ClassExpression {
		this.consume(Token.CLASS);
		let name: ExpressionNode | undefined;
		let isStrictReserved = false;
		if (this.peekAnyIdentifier()) {
			name = this.parseAndClassifyIdentifier(this.next());
			isStrictReserved = Token.isStrictReservedWord(this.current().token);
		}
		const classLiteral = this.parseClassLiteral(name, isStrictReserved);
		return this.factory.createClassExpression(classLiteral.getBody(), classLiteral.getDecorators(), classLiteral.getId()!, classLiteral.getSuperClass());
	}
	protected override parseClassDeclaration(names: string[] | undefined, defaultExport: boolean, start: PositionMark): ClassDeclaration {
		// ClassDeclaration ::
		//   'class' Identifier ('extends' LeftHandExpression)? '{' ClassBody '}'
		//   'class' ('extends' LeftHandExpression)? '{' ClassBody '}'
		//
		// The anonymous form is allowed iff [default_export] is true.
		//
		// 'class' is expected to be consumed by the caller.
		//
		// A ClassDeclaration
		//
		//   class C { ... }
		//
		// has the same semantics as:
		//
		//   let C = class C { ... };
		//
		// so rewrite it as such.

		const nextToken = this.peek().token;
		const isStrictReserved = Token.isStrictReservedWord(nextToken);
		let name: ExpressionNode | undefined;
		let variableName: string | undefined;
		if (defaultExport && (nextToken == Token.EXTENDS || nextToken == Token.LBRACE)) {
			name = new Literal('default');
			variableName = '.default';
		} else {
			const identifier = this.parseIdentifier();
			variableName = identifier.getName() as string;
			name = identifier;
		}
		const classLiteral = this.parseClassLiteral(name, isStrictReserved);
		const range = this.createRange(start);
		return this.factory.createClassDeclaration(
			classLiteral.getBody(),
			classLiteral.getDecorators(),
			classLiteral.getId()!,
			classLiteral.getSuperClass(),
			range
		);
	}
	protected override parseClassLiteral(name: ExpressionNode | undefined, nameIsStrictReserved: boolean): Class {
		const isAnonymous = !!!name;

		// All parts of a ClassDeclaration and ClassExpression are strict code.
		if (!isAnonymous) {
			if (nameIsStrictReserved) {
				throw new Error(this.errorMessage(`Unexpected Strict Reserved class name`));
			}
			if (this.isEvalOrArguments(name!)) {
				throw new Error(this.errorMessage(`Strict Eval Arguments not allowed for class name`));
			}
		}

		const classInfo: ClassInfo = createClassInfo();
		classInfo.isAnonymous = isAnonymous;

		if (this.check(Token.EXTENDS)) {
			classInfo.extends = this.parseLeftHandSideExpression();
		}

		const bodyStart = this.expect(Token.LBRACE);

		const hasExtends = !!classInfo.extends;

		while (this.peek().isNotType(Token.RBRACE)) {
			if (this.check(Token.SEMICOLON)) continue;

			// Either we're parsing a `static { }` initialization block or a property.
			if (this.peek().isType(Token.STATIC) && this.peekAhead().isType(Token.LBRACE)) {
				const staticBlock = this.parseClassStaticBlock(classInfo);
				classInfo.staticElements.push(staticBlock);
				classInfo.hasStaticBlocks = true;
				continue;
			}

			// FuncNameInferrerState fni_state(& fni_);
			// If we haven't seen the constructor yet, it potentially is the next
			// property.
			let isConstructor = !classInfo.hasSeenConstructor;
			const propInfo = new PropertyKindInfo();
			propInfo.position = PropertyPosition.ClassLiteral;

			const property = this.parseClassPropertyDefinition(classInfo, propInfo, hasExtends);

			// if (has_error()) return impl() . FailureExpression();

			const propertyKind = classPropertyKindFor(propInfo.kind);
			if (!classInfo.hasStaticComputedNames && propInfo.isStatic && propInfo.isComputedName) {
				classInfo.hasStaticComputedNames = true;
			}
			isConstructor &&= classInfo.hasSeenConstructor;

			const isField = propertyKind == ClassLiteralPropertyKind.FIELD;

			if (propInfo.isPrivate) {
				if (isConstructor) {
					throw new Error(this.errorMessage('private constructor is not allowed'));
				}
				classInfo.requiresBrand ||= (!isField && !propInfo.isStatic);
				const isMethod = propertyKind == ClassLiteralPropertyKind.METHOD;
				classInfo.hasPrivateMethods ||= isMethod;
				classInfo.hasStaticPrivateMethods ||= isMethod && propInfo.isStatic;
				this.declarePrivateClassMember(propInfo.name, property as MethodDefinition | PropertyDefinition, propertyKind, propInfo.isStatic, classInfo);
				continue;
			}

			if (isField) {
				if (propInfo.isComputedName) {
					classInfo.computedFieldCount++;
				}
				this.declarePublicClassField(property as PropertyDefinition, propInfo.isStatic, propInfo.isComputedName, classInfo);
				continue;
			}

			this.declarePublicClassMethod(name, property as MethodDefinition, isConstructor, classInfo);
		}

		const bodyEnd = this.expect(Token.RBRACE);
		const classBody = this.rewriteClassLiteral(classInfo, name, [bodyStart.range[0], bodyEnd.range[1]]);
		return new Class(classBody, [], name as Identifier, classInfo.extends);
	}
	protected declarePublicClassMethod(name: ExpressionNode | undefined, property: MethodDefinition, isConstructor: boolean, classInfo: ClassInfo): void {
		// throw new Error('Method not implemented.');
		if (isConstructor) {
			if (classInfo.constructor) {
				throw new SyntaxError(this.errorMessage('A class may only have one constructor.'));
			}
			classInfo.constructor = property;
			// set the class name as the constructor name
			Reflect.set(classInfo.constructor, 'id', name);
			return;
		}
		classInfo.publicMembers.push(property);
	}
	protected declarePublicClassField(property: PropertyDefinition, isStatic: boolean, isComputedName: boolean, classInfo: ClassInfo) {
		if (isStatic) {
			classInfo.staticElements.push(property);
		} else {
			classInfo.instanceFields.push(property);
		}

		// if (isComputedName) {
		// 	classInfo.publicMembers.push(property);
		// }

	}
	protected declarePrivateClassMember(propertyName: string, property: MethodDefinition | PropertyDefinition, kind: ClassLiteralPropertyKind, isStatic: boolean, classInfo: ClassInfo) {
		classInfo.privateMembers.push(property);
	}
	// protected createPrivateNameVariable(mode: VariableMode, staticFlag: StaticFlag, propertyName: string) {
	// 	throw new Error('Method not implemented.');
	// }
	protected parseClassPropertyDefinition(classInfo: ClassInfo, propInfo: PropertyKindInfo, hasExtends: boolean) {
		if (!classInfo) {
			throw new Error(this.errorMessage('class info is undefined'));
		}
		if (propInfo.position !== PropertyPosition.ClassLiteral) {
			throw new Error(this.errorMessage('expected property position ClassLiteral'));
		}

		const nameToken = this.peek();
		let nameExpression: ExpressionNode;
		if (nameToken.isType(Token.STATIC)) {
			this.consume(Token.STATIC);
			if (this.peek().isType(Token.LPAREN)) {
				propInfo.kind = PropertyKind.Method;
				nameExpression = this.parseIdentifier();
				propInfo.name = (nameExpression as Identifier).getName() as string;
			} else if (this.peek().isType(Token.ASSIGN)
				|| this.peek().isType(Token.SEMICOLON)
				|| this.peek().isType(Token.RBRACK)) {
				nameExpression = this.parseIdentifier();
				propInfo.name = (nameExpression as Identifier).getName() as string;
			} else {
				propInfo.isStatic = true;
				nameExpression = this.parseProperty(propInfo);
			}
		} else {
			nameExpression = this.parseProperty(propInfo);
		}

		switch (propInfo.kind) {
			case PropertyKind.Assign:
			case PropertyKind.ClassField:
			case PropertyKind.ShorthandOrClassField:
			case PropertyKind.NotSet: {
				// This case is a name followed by a
				// name or other property. Here we have
				// to assume that's an uninitialized
				// field followed by a line break
				// followed by a property, with ASI
				// adding the semicolon. If not, there
				// will be a syntax error after parsing
				// the first name as an uninitialized
				// field.
				propInfo.kind = PropertyKind.ClassField;

				// if (!propInfo.isComputedName) {
				// 	this.checkClassFieldName(propInfo.name, propInfo.isStatic);
				// }

				const initializer = this.parseMemberInitializer(classInfo, propInfo.isStatic);
				this.expectSemicolon();

				const result: ExpressionNode = this.newClassLiteralProperty(
					nameExpression,
					initializer,
					ClassLiteralPropertyKind.FIELD,
					propInfo.isStatic,
					propInfo.isComputedName,
					propInfo.isPrivate,
					propInfo.rangeStart
				);
				this.setFunctionNameFromPropertyName(result, propInfo.name);
				return result;
			}
			case PropertyKind.Method: {
				// MethodDefinition
				//    PropertyName '(' StrictFormalParameters ')' '{' FunctionBody '}'
				//    '*' PropertyName '(' StrictFormalParameters ')' '{' FunctionBody '}'
				//    async PropertyName '(' StrictFormalParameters ')'
				//        '{' FunctionBody '}'
				//    async '*' PropertyName '(' StrictFormalParameters ')'
				//        '{' FunctionBody '}'

				if (!propInfo.isComputedName) {
					this.checkClassMethodName(propInfo, classInfo);
				}

				let kind: FunctionKind = this.methodKindFor(propInfo.isStatic, propInfo.funcFlag);

				if (!propInfo.isStatic && propInfo.name.toString() === 'constructor') {
					classInfo.hasSeenConstructor = true;
					kind = hasExtends ? FunctionKind.DerivedConstructor : FunctionKind.BaseConstructor;
				}

				const value = this.parseFunctionLiteral(kind, FunctionSyntaxKind.AccessorOrMethod, nameExpression as Identifier, propInfo.rangeStart);

				const result = this.newClassLiteralProperty(
					nameExpression, value, ClassLiteralProperty.Kind.METHOD,
					propInfo.isStatic, propInfo.isComputedName,
					propInfo.isPrivate,
					propInfo.rangeStart
				);
				this.setFunctionNameFromPropertyName(result, propInfo.name);
				return result;
			}

			case PropertyKind.AccessorGetter:
			case PropertyKind.AccessorSetter: {
				if (propInfo.funcFlag !== ParseFunctionFlag.IsNormal) {
					throw new Error(this.errorMessage('accessor is not normal function'));
				}
				const isGet = propInfo.kind == PropertyKind.AccessorGetter;

				if (!propInfo.isComputedName) {
					this.checkClassMethodName(propInfo, classInfo);
					// Make sure the name expression is a string since we need a Name for
					// Runtime_DefineAccessorPropertyUnchecked and since we can determine
					// this statically we can skip the extra runtime check.
					nameExpression = new Literal<string>(propInfo.name);
				}

				let kind: FunctionKind;
				if (propInfo.isStatic) {
					kind = isGet ? FunctionKind.StaticGetterFunction
						: FunctionKind.StaticSetterFunction;
				} else {
					kind = isGet ? FunctionKind.GetterFunction
						: FunctionKind.SetterFunction;
				}

				const value = this.parseFunctionLiteral(kind, FunctionSyntaxKind.AccessorOrMethod, nameExpression as Identifier, propInfo.rangeStart);

				const propertyKind: ClassLiteralPropertyKind = isGet ? ClassLiteralProperty.Kind.GETTER : ClassLiteralProperty.Kind.SETTER;
				const result = this.newClassLiteralProperty(
					nameExpression, value, propertyKind,
					propInfo.isStatic, propInfo.isComputedName,
					propInfo.isPrivate,
					propInfo.rangeStart
				);
				const prefix = isGet ? 'get ' : 'set ';
				this.setFunctionNameFromPropertyName(result, propInfo.name, prefix);
				return result;
			}
			case PropertyKind.Value:
			case PropertyKind.Shorthand:
			case PropertyKind.Spread:
				// throw new Error(this.errorMessage('Report Unexpected Token'));
				return this.factory.createNull(propInfo.rangeStart?.range);
		}
		throw new Error(this.errorMessage('UNREACHABLE'));
	}
	protected checkClassMethodName(propInfo: PropertyKindInfo, classInfo: ClassInfo) {
		if (!(propInfo.kind == PropertyKind.Method || isAccessor(propInfo.kind))) {
			throw new Error(this.errorMessage('not kind of method or setter or getter'));
		}
		if (propInfo.isPrivate && propInfo.name.toString() === 'constructor') {
			throw new Error(this.errorMessage('constructor is private'));
		} else if (propInfo.isStatic && propInfo.name.toString() === 'prototype') {
			throw new Error(this.errorMessage('static prototype'));
		} else if (propInfo.name.toString() === 'constructor') {
			if (propInfo.funcFlag !== ParseFunctionFlag.IsNormal || isAccessor(propInfo.kind)) {
				if (propInfo.funcFlag === ParseFunctionFlag.IsGenerator) {
					throw new Error(this.errorMessage('constructor is generator'));
				} else if (propInfo.funcFlag === ParseFunctionFlag.IsAsync) {
					throw new Error(this.errorMessage('constructor is async'));
				}
				if (classInfo.hasSeenConstructor) {
					throw new Error(this.errorMessage('duplicate constructor'));
				}
			}
			classInfo.hasSeenConstructor = true;
		}
	}
	protected parseClassStaticBlock(classInfo: ClassInfo): StaticBlock {
		this.consume(Token.STATIC);
		// Each static block has its own var and lexical scope, so make a new var
		// block scope instead of using the synthetic members initializer function
		// scope.
		this.setStatue(true, FunctionKind.ClassStaticInitializerFunction);
		const block = this.parseBlock();
		this.restoreStatue();
		classInfo.hasStaticElements = true;
		return this.factory.createClassStaticBlockDeclaration(block.getBody(), block.range);
	}
	protected newClassLiteralProperty(
		nameExpression: ExpressionNode,
		initializer: ExpressionNode | undefined,
		kind: ClassLiteralPropertyKind,
		isStatic: boolean,
		isComputedName: boolean,
		isPrivate: boolean,
		start: PositionMark) {
		const range = this.createRange(start);
		switch (kind) {
			case ClassLiteralPropertyKind.METHOD:
				if (nameExpression.toString() === 'constructor') {
					return this.factory.createMethodSignature('constructor', nameExpression, initializer as FunctionExpression, [], isComputedName, isStatic, range);
				}
				return this.factory.createMethodSignature('method', nameExpression, initializer as FunctionExpression, [], isComputedName, isStatic, range);
			case ClassLiteralPropertyKind.GETTER:
				return this.factory.createMethodSignature('get', nameExpression, initializer as FunctionExpression, [], isComputedName, isStatic, range);
			case ClassLiteralPropertyKind.SETTER:
				return this.factory.createMethodSignature('set', nameExpression, initializer as FunctionExpression, [], isComputedName, isStatic, range);
			case ClassLiteralPropertyKind.FIELD:
				return this.factory.createPropertySignature(nameExpression, [], isComputedName, isStatic, initializer, range);
			default:
				break;
		}
		throw new Error(this.errorMessage('UNREACHABLE'));
	}
	protected parseMemberInitializer(classInfo: ClassInfo, isStatic: boolean): ExpressionNode | undefined {
		const kind = isStatic
			? FunctionKind.ClassStaticInitializerFunction
			: FunctionKind.ClassMembersInitializerFunction;
		let initializer: ExpressionNode | undefined = undefined;
		if (this.check(Token.ASSIGN)) {
			this.setStatue(true, kind);
			initializer = this.parseAssignmentExpression();
			this.restoreStatue();
		}
		if (isStatic) {
			classInfo.hasStaticElements = true;
		} else {
			classInfo.hasInstanceMembers = true;
		}
		return initializer;
	}
	protected setFunctionNameFromPropertyName(property: ExpressionNode, name: string, prefix?: string): void {
		// TODO: no need for this now
		// check later when needed
		// the ClassExpression* handle this
	}
	protected parseSuperExpression(): ExpressionNode {
		const superToken = this.consume(Token.SUPER);
		if (Token.isProperty(this.peek().token)) {
			if (this.peek().isType(Token.PERIOD) && this.peekAhead().isType(Token.PRIVATE_NAME)) {
				this.consume(Token.PERIOD);
				this.consume(Token.PRIVATE_NAME);
				throw new Error(this.errorMessage('Unexpected Private Field'));
			}
			if (this.peek().isType(Token.QUESTION_PERIOD)) {
				this.consume(Token.QUESTION_PERIOD);
				throw new Error(this.errorMessage('Optional Chaining No Super'));
			}
			return this.factory.createSuper(superToken.range);
		}
		throw new Error(this.errorMessage('Unexpected Super'));
	}
	protected rewriteClassLiteral(classInfo: ClassInfo, name?: ExpressionNode, range?: [number, number]): ClassBody {
		const body: (MethodDefinition | PropertyDefinition | AccessorProperty | StaticBlock)[] = [];
		if (classInfo.hasSeenConstructor) {
			body.push(classInfo.constructor as MethodDefinition);
		}
		body.push(...classInfo.staticElements);
		body.push(...classInfo.instanceFields);
		body.push(...classInfo.publicMembers);
		body.push(...classInfo.privateMembers);
		return this.factory.createClassBody(body, range);
	}
	protected parseModuleItemList(): ExpressionNode[] {
		// ecma262/#prod-Module
		// Module :
		//    ModuleBody?
		//
		// ecma262/#prod-ModuleItemList
		// ModuleBody :
		//    ModuleItem*
		const body: ExpressionNode[] = [];
		while (this.peek().isNotType(Token.EOS)) {
			const stat = this.parseModuleItem();
			if (!stat) {
				break;
			}
			if (this.isEmptyStatement(stat)) {
				continue;
			}
			body.push(stat);
		}
		return body;
	}
	protected parseModuleItem(): ExpressionNode | undefined {
		// ecma262/#prod-ModuleItem
		// ModuleItem :
		//    ImportDeclaration
		//    ExportDeclaration
		//    StatementListItem

		const next = this.peek();
		if (next.isType(Token.EXPORT)) {
			return this.parseExportDeclaration();
		}
		if (next.isType(Token.IMPORT)) {
			// We must be careful not to parse a dynamic import expression as an import
			// declaration. Same for import.meta expressions.
			const peekAhead = this.peekAhead();
			if (peekAhead.isNotType(Token.LPAREN) && peekAhead.isNotType(Token.PERIOD)) {
				return this.parseImportDeclaration();
				// return factory() -> EmptyStatement();
			}
		}

		return this.parseStatementListItem();
	}
	protected parseExportDeclaration(): ExpressionNode | undefined {
		// ExportDeclaration:
		//    'export' '*' 'from' ModuleSpecifier ';'
		//    'export' '*' 'from' ModuleSpecifier [no LineTerminator here]
		//        AssertClause ';'
		//    'export' '*' 'as' IdentifierName 'from' ModuleSpecifier ';'
		//    'export' '*' 'as' IdentifierName 'from' ModuleSpecifier
		//        [no LineTerminator here] AssertClause ';'
		//    'export' '*' 'as' ModuleExportName 'from' ModuleSpecifier ';'
		//    'export' '*' 'as' ModuleExportName 'from' ModuleSpecifier ';'
		//        [no LineTerminator here] AssertClause ';'
		//    'export' ExportClause ('from' ModuleSpecifier)? ';'
		//    'export' ExportClause ('from' ModuleSpecifier [no LineTerminator here]
		//        AssertClause)? ';'
		//    'export' VariableStatement
		//    'export' Declaration
		//    'export' 'default' ... (handled in ParseExportDefault)
		//
		// ModuleExportName :
		//   StringLiteral

		const start = this.expect(Token.EXPORT);
		let result: ExpressionNode | undefined;
		const names: string[] = [];

		// Statement * result = nullptr;
		// ZonePtrList <const AstRawString> names(1, zone());
		// Scanner::Location loc = scanner() -> peek_location();
		switch (this.peek().token) {
			case Token.DEFAULT:
				return this.parseExportDefault();

			case Token.MUL:
				return this.parseExportStar();

			case Token.LBRACE: {
				// There are two cases here:
				//
				// 'export' ExportClause ';'
				// and
				// 'export' ExportClause FromClause ';'
				//
				// In the first case, the exported identifiers in ExportClause must
				// not be reserved words, while in the latter they may be. We
				// pass in a location that gets filled with the first reserved word
				// encountered, and then throw a SyntaxError if we are in the
				// non-FromClause case.

				// Scanner::Location reserved_loc = Scanner:: Location:: invalid();
				// Scanner::Location string_literal_local_name_loc =
				// Scanner:: Location:: invalid();
				// ZoneChunkList < ExportClauseData >* export_data =
				// ParseExportClause(& reserved_loc, & string_literal_local_name_loc);

				const exportData = this.parseExportClause();
				let moduleSpecifier: Literal<string> | undefined;
				let importAssertions: ImportAttribute[] | undefined;

				if (this.checkContextualKeyword('from')) {
					// Scanner::Location specifier_loc = scanner() -> peek_location();
					moduleSpecifier = this.parseModuleSpecifier();
					importAssertions = this.parseImportAssertClause();
					this.expectSemicolon();

					// if (exportData.isEmpty()) {
					// 	// module() -> AddEmptyImport(module_specifier, import_assertions, specifier_loc, zone());
					// } else {
					// 	// for (const ExportClauseData& data : * export_data) {
					// 	// 	module() -> AddExport(data.local_name, data.export_name,
					// 	// 		module_specifier, import_assertions,
					// 	// 		data.location, specifier_loc, zone());
					// 	// }
					// }
				} else {
					// if (reserved_loc.IsValid()) {
					// 	// No FromClause, so reserved words are invalid in ExportClause.
					// 	ReportMessageAt(reserved_loc, MessageTemplate:: kUnexpectedReserved);
					// 	return nullptr;
					// } else if (string_literal_local_name_loc.IsValid()) {
					// 	ReportMessageAt(string_literal_local_name_loc,
					// 		MessageTemplate:: kModuleExportNameWithoutFromClause);
					// 	return nullptr;
					// }

					this.expectSemicolon();

					// for (const ExportClauseData& data : * export_data) {
					// 	module() -> AddExport(data.local_name, data.export_name, data.location,
					// 		zone());
					// }
				}
				return this.factory.createNamespaceExportDeclaration(exportData, undefined, moduleSpecifier, importAssertions, this.createRange(start));
				// return factory() -> EmptyStatement();
			}

			case Token.FUNCTION: {
				const declaration = this.parseFunctionDeclaration();
				const identifier = declaration.getId()!;
				const specifier = this.factory.createExportSpecifier(identifier, identifier, identifier.range);
				result = this.factory.createNamespaceExportDeclaration([specifier], declaration, undefined, undefined, this.createRange(start));
				break;
			}

			case Token.CLASS: {
				const classToken = this.consume(Token.CLASS);
				const declaration = this.parseClassDeclaration(names, false, classToken);
				const identifier = declaration.getId()!;
				const specifier = this.factory.createExportSpecifier(identifier, identifier, identifier.range);
				result = this.factory.createNamespaceExportDeclaration([specifier], declaration, undefined, undefined, this.createRange(start));
				break;
			}

			case Token.VAR:
			case Token.LET:
			case Token.CONST:
				const declaration = this.parseVariableStatement(VariableDeclarationContext.StatementListItem, names);
				const specifiers = declaration.getDeclarations()
					.map(node => this.factory.createExportSpecifier(node.getId() as Identifier, node.getId() as Identifier, node.getId().range));
				result = this.factory.createNamespaceExportDeclaration(specifiers, declaration, undefined, undefined, this.createRange(start));
				break;

			case Token.ASYNC:
				const asyncToken = this.consume(Token.ASYNC);
				if (this.peek().isType(Token.FUNCTION) && !this.scanner.hasLineTerminatorBeforeNext()) {
					const declaration = this.parseAsyncFunctionDeclaration(names, false, asyncToken);
					const identifier = declaration.getId()!;
					const specifier = this.factory.createExportSpecifier(identifier, identifier, identifier.range);
					result = this.factory.createNamespaceExportDeclaration([specifier], declaration, undefined, undefined, this.createRange(start));
					break;
				}

			default:
				throw new SyntaxError(this.errorMessage('Unexpected Token'));
		}
		// loc.end_pos = scanner() -> location().end_pos;

		// SourceTextModuleDescriptor * descriptor = module();
		// for (const AstRawString* name : names) {
		// 	descriptor -> AddExport(name, name, loc, zone());
		// }

		return result;
	}
	protected parseImportDeclaration(): ExpressionNode | undefined {
		// ImportDeclaration :
		//   'import' ImportClause 'from' ModuleSpecifier ';'
		//   'import' ModuleSpecifier ';'
		//   'import' ImportClause 'from' ModuleSpecifier [no LineTerminator here]
		//       AssertClause ';'
		//   'import' ModuleSpecifier [no LineTerminator here] AssertClause';'
		//
		// ImportClause :
		//   ImportedDefaultBinding
		//   NameSpaceImport
		//   NamedImports
		//   ImportedDefaultBinding ',' NameSpaceImport
		//   ImportedDefaultBinding ',' NamedImports
		//
		// NameSpaceImport :
		//   '*' 'as' ImportedBinding

		const start = this.expect(Token.IMPORT);

		const tok = this.peek();

		// 'import' ModuleSpecifier ';'
		if (tok.isType(Token.STRING)) {
			// Scanner::Location specifier_loc = scanner() -> peek_location();
			const moduleSpecifier = this.parseModuleSpecifier();
			const importAssertions = this.parseImportAssertClause();
			this.expectSemicolon();

			// module() -> AddEmptyImport(module_specifier, import_assertions, specifier_loc,zone());
			return this.factory.createImportDeclaration(moduleSpecifier, undefined, importAssertions, this.createRange(start));
		}

		// Parse ImportedDefaultBinding if present.
		let importDefaultBinding: Identifier | undefined;
		// Scanner::Location import_default_binding_loc;
		if (tok.isNotType(Token.MUL) && tok.isNotType(Token.LBRACE)) {
			importDefaultBinding = this.parseNonRestrictedIdentifier();
			// DeclareUnboundVariable(import_default_binding, VariableMode:: kConst,kNeedsInitialization, pos);
		}

		// Parse NameSpaceImport or NamedImports if present.
		let moduleNamespaceBinding: Identifier | undefined;
		let namedImports: ModuleSpecifier[] | undefined;
		// Scanner::Location module_namespace_binding_loc;
		// const ZonePtrList<const NamedImport >* named_imports = nullptr;
		if (importDefaultBinding == undefined || this.check(Token.COMMA)) {
			switch (this.peek().token) {
				case Token.MUL: {
					this.consume(Token.MUL);
					this.expectContextualKeyword('as');
					moduleNamespaceBinding = this.parseNonRestrictedIdentifier();
					// ExpectContextualKeyword(ast_value_factory() -> as_string());
					// module_namespace_binding = ParseNonRestrictedIdentifier();
					// module_namespace_binding_loc = scanner() -> location();
					// DeclareUnboundVariable(module_namespace_binding, VariableMode:: kConst, kCreatedInitialized, pos);
					break;
				}

				case Token.LBRACE:
					namedImports = this.parseNamedImports();
					break;

				default:
					throw new SyntaxError(this.errorMessage('Unexpected Token'));
			}
		}
		this.expectContextualKeyword('from');
		// ExpectContextualKeyword(ast_value_factory() -> from_string());
		// Scanner::Location specifier_loc = scanner() -> peek_location();
		const moduleSpecifier = this.parseModuleSpecifier();
		const importAssertions = this.parseImportAssertClause();
		this.expectSemicolon();

		// Now that we have all the information, we can make the appropriate
		// declarations.

		// TODO(neis): Would prefer to call DeclareVariable for each case below rather
		// than above and in ParseNamedImports, but then a possible error message
		// would point to the wrong location.  Maybe have a DeclareAt version of
		// Declare that takes a location?

		const specifiers: ModuleSpecifier[] = [];
		if (moduleNamespaceBinding) {
			specifiers.push(this.factory.createImportNamespaceSpecifier(moduleNamespaceBinding, moduleNamespaceBinding.range));
		}
		if (importDefaultBinding) {
			specifiers.push(this.factory.createImportDefaultSpecifier(importDefaultBinding, importDefaultBinding.range));
		}
		if (namedImports?.length) {
			specifiers.push(...namedImports);
		}
		return this.factory.createImportDeclaration(moduleSpecifier, specifiers.length ? specifiers : undefined, importAssertions, this.createRange(start));
	}
	protected parseImportExpressions(): ExpressionNode {
		const start = this.consume(Token.IMPORT);
		if (this.check(Token.PERIOD)) {
			const peek = this.peek();
			this.expectContextualKeyword('meta');
			return this.factory.createMetaProperty(
				this.factory.createIdentifier('import', start.range),
				this.factory.createIdentifier('meta', peek.range),
				this.createRange(start)
			);
		}

		if (this.peek().isNotType(Token.LPAREN)) {
			throw new SyntaxError(this.errorMessage('Unexpected Token'));
		}

		this.consume(Token.LPAREN);
		if (this.peek().isType(Token.RPAREN)) {
			throw new SyntaxError(this.errorMessage('Import Missing Specifier'));
		}
		this.setAcceptIN(true);
		const specifier = this.parseAssignmentExpressionCoverGrammar();

		if (this.check(Token.COMMA)) {
			if (this.check(Token.RPAREN)) {
				// A trailing comma allowed after the specifier.
				return this.factory.createImportExpression(specifier as Literal<string>, undefined, this.createRange(start));
			} else {
				const importAssertions = this.parseAssignmentExpressionCoverGrammar();
				this.check(Token.COMMA);  // A trailing comma is allowed after the import
				// assertions.
				this.expect(Token.RPAREN);
				return this.factory.createImportExpression(specifier as Literal<string>, importAssertions, this.createRange(start));
			}
		}

		this.expect(Token.RPAREN);
		this.restoreAcceptIN();
		return this.factory.createImportExpression(specifier as Literal<string>, undefined, this.createRange(start));
	}
	protected parseVariableStatement(varContext: VariableDeclarationContext, names: string[]) {
		// VariableStatement ::
		//   VariableDeclarations ';'

		// The scope of a var declared variable anywhere inside a function
		// is the entire function (ECMA-262, 3rd, 10.1.3, and 12.2). Thus we can
		// transform a source-level var declaration into a (Function) Scope
		// declaration, and rewrite the source-level initialization into an assignment
		// statement. We use a block to collect multiple assignments.
		//
		// We mark the block as initializer block because we don't want the
		// rewriter to add a '.result' assignment to such a block (to get compliant
		// behavior for code such as print(eval('var x = 7')), and for cosmetic
		// reasons when pretty-printing. Also, unless an assignment (initialization)
		// is inside an initializer block, it is ignored.
		const declarations = this.parseVariableDeclarations(varContext);
		this.expectSemicolon();
		names.push(...declarations.getDeclarations().map(d => d.getId().toString()));
		return declarations;
	}
	protected parseImportAssertClause(): ImportAttribute[] | undefined {
		// AssertClause :
		//    assert '{' '}'
		//    assert '{' AssertEntries '}'

		// AssertEntries :
		//    IdentifierName: AssertionKey
		//    IdentifierName: AssertionKey , AssertEntries

		// AssertionKey :
		//     IdentifierName
		//     StringLiteral

		//   auto import_assertions = zone() -> New<ImportAssertions>(zone());

		// if (!FLAG_harmony_import_assertions) {
		// 	return import_assertions;
		// }

		// Assert clause is optional, and cannot be preceded by a LineTerminator.
		if (this.scanner.hasLineTerminatorBeforeNext() || !this.checkContextualKeyword('assert')) {
			return undefined;
		}
		this.expect(Token.LBRACE);
		const counts = {} as { [key: string]: number };
		const importAssertions: ImportAttribute[] = [];
		while (this.peek().isNotType(Token.RBRACE)) {
			let attributeKey = this.checkAndGetValue(Token.STRING);
			if (!attributeKey) {
				attributeKey = this.parsePropertyOrPrivatePropertyName();
			}
			this.expect(Token.COLON);
			const attributeValue = this.expectAndGetValue(Token.STRING);
			importAssertions.push(new ImportAttribute(attributeKey as Identifier, attributeValue as Literal<string>));
			counts[attributeKey.toString()] = (counts[attributeKey.toString()] ?? 0) + 1;
			if (counts[attributeKey.toString()] > 1) {
				// 	// It is a syntax error if two AssertEntries have the same key.
				throw new SyntaxError(this.errorMessage('Import Assertion  Duplicate Key'));
			}

			if (this.peek().isType(Token.RBRACE)) break;
			if (!this.check(Token.COMMA)) {
				throw new SyntaxError('Unexpected Token');
			}
		}
		this.expect(Token.RBRACE);
		return importAssertions;
	}
	protected parseModuleSpecifier(): Literal<string> {
		// ModuleSpecifier :
		//    StringLiteral

		return this.expectAndGetValue(Token.STRING) as Literal<string>;
	}
	protected parseExportClause() {
		// ExportClause :
		//   '{' '}'
		//   '{' ExportsList '}'
		//   '{' ExportsList ',' '}'
		//
		// ExportsList :
		//   ExportSpecifier
		//   ExportsList ',' ExportSpecifier
		//
		// ExportSpecifier :
		//   IdentifierName
		//   IdentifierName 'as' IdentifierName
		//   IdentifierName 'as' ModuleExportName
		//   ModuleExportName
		//   ModuleExportName 'as' ModuleExportName
		//
		// ModuleExportName :
		//   StringLiteral
		// ZoneChunkList < ExportClauseData >* export_data = zone() -> New<ZoneChunkList<ExportClauseData>>(zone());

		this.expect(Token.LBRACE);

		const exportData: ExportSpecifier[] = [];
		let nameTok = this.peek();
		while (nameTok.isNotType(Token.RBRACE)) {
			const localName = this.parseExportSpecifierName();
			let exportName;
			if (this.checkContextualKeyword('as')) {
				exportName = this.parseExportSpecifierName();
			} else {
				exportName = localName;
			}
			exportData.push(new ExportSpecifier(exportName as Identifier, localName as Identifier));
			if (this.peek().isType(Token.RBRACE)) break;
			if (!this.check(Token.COMMA)) {
				throw new SyntaxError('Unexpected Token');
			}
		}
		this.expect(Token.RBRACE);
		return exportData;
	}
	protected parseExportSpecifierName() {
		const next = this.next();

		// IdentifierName
		if (next.isType(Token.IDENTIFIER) || Token.isPropertyName(next.token)) {
			return next.getValue() as Identifier;
		}

		// ModuleExportName
		if (next.isType(Token.STRING)) {
			const exportName = next.getValue() as Literal<string>;
			return exportName;
		}
		throw new SyntaxError(this.errorMessage('Unexpected Token'));
	}
	protected parseNamedImports(): ImportSpecifier[] {
		// NamedImports :
		//   '{' '}'
		//   '{' ImportsList '}'
		//   '{' ImportsList ',' '}'
		//
		// ImportsList :
		//   ImportSpecifier
		//   ImportsList ',' ImportSpecifier
		//
		// ImportSpecifier :
		//   BindingIdentifier
		//   IdentifierName 'as' BindingIdentifier
		//   ModuleExportName 'as' BindingIdentifier

		this.expect(Token.LBRACE);
		const result: ImportSpecifier[] = [];

		//   auto result = zone() -> New < ZonePtrList <const NamedImport>> (1, zone());
		while (this.peek().isNotType(Token.RBRACE)) {
			const importName = this.parseExportSpecifierName() as Identifier;
			let localName = importName;
			// In the presence of 'as', the left-side of the 'as' can
			// be any IdentifierName. But without 'as', it must be a valid
			// BindingIdentifier.
			if (this.checkContextualKeyword('as')) {
				localName = this.parsePropertyOrPrivatePropertyName() as Identifier;
			}
			if (!Token.isValidIdentifier(this.current().token, LanguageMode.Strict, false, isStrict(this.languageMode))) {
				throw new SyntaxError(this.errorMessage('Unexpected Reserved Keyword'));
			} else if (this.isEvalOrArguments(localName)) {
				throw new SyntaxError(this.errorMessage('Strict Eval Arguments'));
			}

			result.push(new ImportSpecifier(localName, importName));

			// DeclareUnboundVariable(localName, VariableMode:: kConst, kNeedsInitialization, position());

			// NamedImport * import = zone() -> New<NamedImport>(import_name, local_name, location);
			// result-> Add(import, zone());

			if (this.peek().isType(Token.RBRACE)) break;
			this.expect(Token.COMMA);
		}

		this.expect(Token.RBRACE);
		return result;
	}

	protected parseExportDefault(): ExportDefaultDeclaration {
		//  Supports the following productions, starting after the 'default' token:
		//    'export' 'default' HoistableDeclaration
		//    'export' 'default' ClassDeclaration
		//    'export' 'default' AssignmentExpression[In] ';'

		this.expect(Token.DEFAULT);
		// Scanner::Location default_loc = scanner() -> location();

		// ZonePtrList <const AstRawString> localNames(1, zone());
		const localNames: string[] = [];
		let result: ExpressionNode;
		switch (this.peek().token) {
			case Token.FUNCTION:
				result = this.parseHoistableDeclaration(localNames, true, this.peek());
				break;

			case Token.CLASS:
				const classToken = this.consume(Token.CLASS);
				result = this.parseClassDeclaration(localNames, true, classToken);
				break;

			case Token.ASYNC:
				if (this.peekAhead().isType(Token.FUNCTION) && !this.scanner.hasLineTerminatorBeforeNext()) {
					const asyncStart = this.consume(Token.ASYNC);
					result = this.parseHoistableDeclaration(localNames, true, asyncStart);
					break;
				}

			default: {
				// int pos = position();
				// AcceptINScope scope(this, true);
				this.setAcceptIN(true);
				result = this.parseAssignmentExpression();
				// SetFunctionName(value, ast_value_factory() -> default_string());

				// const AstRawString* local_name = ast_value_factory() -> dot_default_string();
				// localNames.Add(local_name, zone());

				// It's fine to declare this as VariableMode::kConst because the user has
				// no way of writing to it.
				// VariableProxy * proxy = DeclareBoundVariable(local_name, VariableMode:: kConst, pos);
				// proxy ->var() -> set_initializer_position(position());

				// Assignment * assignment = factory() -> NewAssignment(Token.INIT, proxy, value, kNoSourcePosition);
				// result = IgnoreCompletion( factory() -> NewExpressionStatement(assignment, kNoSourcePosition));

				this.expectSemicolon();
				this.restoreAcceptIN();
				break;
			}
		}

		// if (!result) {
		// 	DCHECK_EQ(localNames.length(), 1);
		// 	module() -> AddExport(localNames.first(), ast_value_factory() -> default_string(), default_loc, zone());
		// }

		return new ExportDefaultDeclaration(result);
	}
	protected parseExportStar(): ExpressionNode | undefined {
		this.consume(Token.MUL);

		if (!this.peekContextualKeyword('as')) {
			// 'export' '*' 'from' ModuleSpecifier ';'
			// Scanner::Location loc = scanner() -> location();
			this.expectContextualKeyword('from');
			// Scanner::Location specifier_loc = scanner() -> peek_location();
			const moduleSpecifier = this.parseModuleSpecifier();
			const importAssertions = this.parseImportAssertClause();
			this.expectSemicolon();
			// module() -> AddStarExport(module_specifier, import_assertions, loc,specifier_loc, zone());
			return new ExportAllDeclaration(moduleSpecifier, undefined, importAssertions);
		}

		// 'export' '*' 'as' IdentifierName 'from' ModuleSpecifier ';'
		//
		// Desugaring:
		//   export * as x from "...";
		// ~>
		//   import * as .x from "..."; export {.x as x};
		//
		// Note that the desugared internal namespace export name (.x above) will
		// never conflict with a string literal export name, as literal string export
		// names in local name positions (i.e. left of 'as' or in a clause without
		// 'as') are disallowed without a following 'from' clause.

		this.expectContextualKeyword('as');
		const exportName = this.parseExportSpecifierName();
		// Scanner::Location export_name_loc = scanner() -> location();
		// const localName = this.nextInternalNamespaceExportName();
		// Scanner::Location local_name_loc = Scanner:: Location:: invalid();
		// DeclareUnboundVariable(local_name, VariableMode:: kConst, kCreatedInitialized,pos);

		this.expectContextualKeyword('from');
		const moduleSpecifier = this.parseModuleSpecifier();
		const importAssertions = this.parseImportAssertClause();
		this.expectSemicolon();

		// const specifiers = [new ExportSpecifier(exportName as Identifier, exportName as Identifier)];

		// module() -> AddStarImport(local_name, module_specifier, import_assertions,local_name_loc, specifier_loc, zone());
		// module() -> AddExport(local_name, export_name, export_name_loc, zone());
		return new ExportAllDeclaration(moduleSpecifier, exportName as Identifier, importAssertions);
	}

	protected parseWithStatement(): WithStatement {
		// WithStatement ::
		//   'with' '(' Expression ')' Statement

		const start = this.consume(Token.WITH);
		if (isStrict(this.languageMode)) {
			throw new SyntaxError(this.errorMessage('With is not allowed in Strict mode.'));
		}
		this.expect(Token.LPAREN);
		const object = this.parseExpression();
		this.expect(Token.RPAREN);
		const body = this.parseStatement();
		const range = this.createRange(start);
		return this.factory.createWithStatement(object, body, range);
	}
}
