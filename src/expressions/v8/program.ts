import type { ExpressionNode } from '../api/expression.js';
import { isAccessor, JavaScriptParser, PropertyKind, PropertyKindInfo, PropertyPosition } from './parser.js';
import { Token, TokenExpression } from './token.js';
import {
	AccessorProperty, Class, ClassBody, ClassDeclaration, ClassExpression,
	MetaProperty, MethodDefinition, PropertyDefinition, StaticBlock, Super
} from '../api/class/class.js';
import { FunctionExpression, FunctionKind } from '../api/definition/function.js';
import { Identifier, Literal, NullNode } from '../api/definition/values.js';
import { AssignmentExpression } from '../api/operators/assignment.js';
import { VariableDeclarationNode, VariableDeclarator } from '../api/statement/declarations/declares.js';
import { TokenStream } from './stream.js';
import { Program } from '../api/program.js';
import { ExportNamedDeclaration } from '../api/module/export.js';


export type ClassInfo = {
	extends?: ExpressionNode;
	publicMembers: (MethodDefinition | PropertyDefinition)[],
	privateMembers: (MethodDefinition | PropertyDefinition)[],
	staticElements: (MethodDefinition | PropertyDefinition | AccessorProperty | StaticBlock)[],
	instanceFields: (MethodDefinition | PropertyDefinition | AccessorProperty)[],
	constructor: MethodDefinition | undefined,

	hasSeenConstructor: boolean;
	hasStaticComputedNames: boolean;
	hasStaticElements: boolean;
	hasStaticPrivateMethods: boolean;
	hasStaticBlocks: boolean;
	hasInstanceMembers: boolean;
	requiresBrand: boolean;
	isAnonymous: boolean;
	hasPrivateMethods: boolean,

	computedFieldCount: number;

	homeObjectVariable?: VariableDeclarator;
	staticHomeObjectVariable?: VariableDeclarator;
};

export function createClassInfo(): ClassInfo {
	return {
		publicMembers: [],
		privateMembers: [],
		staticElements: [],
		instanceFields: [],
		'constructor': undefined,

		hasSeenConstructor: false,
		hasStaticComputedNames: false,
		hasStaticElements: false,
		hasStaticPrivateMethods: false,
		hasStaticBlocks: false,
		hasInstanceMembers: false,
		requiresBrand: false,
		isAnonymous: false,
		hasPrivateMethods: false,

		computedFieldCount: 0,
	};
}

export enum FunctionNameValidity {
	FunctionNameIsStrictReserved = 'FunctionNameIsStrictReserved',
	SkipFunctionNameCheck = 'SkipFunctionNameCheck',
	FunctionNameValidityUnknown = 'FunctionNameValidityUnknown'
};

export enum AllowLabelledFunctionStatement {
	AllowLabelledFunctionStatement = 'AllowLabelledFunctionStatement',
	DisallowLabelledFunctionStatement = 'DisallowLabelledFunctionStatement',
};


const FUNCTIONS_TYPES: FunctionKind[][][] = [
	[
		// SubFunctionKind::kNormalFunction
		[// is_generator=false
			FunctionKind.NORMAL,
			FunctionKind.ASYNC
		],
		[// is_generator=true
			FunctionKind.GENERATOR,
			FunctionKind.ASYNC_GENERATOR
		],
	],
	[
		// SubFunctionKind::kNonStaticMethod
		[// is_generator=false
			FunctionKind.CONCISE,
			FunctionKind.ASYNC_CONCISE
		],
		[// is_generator=true
			FunctionKind.CONCISE_GENERATOR,
			FunctionKind.ASYNC_CONCISE_GENERATOR
		],
	],
	[
		// SubFunctionKind::kStaticMethod
		[// is_generator=false
			FunctionKind.STATIC_CONCISE,
			FunctionKind.STATIC_ASYNC_CONCISE
		],
		[// is_generator=true
			FunctionKind.STATIC_CONCISE_GENERATOR,
			FunctionKind.STATIC_ASYNC_CONCISE_GENERATOR
		],
	]
];

export enum SubFunctionKind {
	NormalFunction,
	NonStaticMethod,
	StaticMethod,
}

export enum StaticFlag {
	NotStatic,
	Static
};

export function functionKindForImpl(subFunctionKind: SubFunctionKind, isGenerator: boolean, isAsync: boolean): FunctionKind {
	return FUNCTIONS_TYPES[subFunctionKind as number][isGenerator ? 1 : 0][isAsync ? 1 : 0];
}

enum ObjectLiteralPropertyKind {
	CONSTANT = 'CONSTANT',	// Property with constant value (compile time).
	COMPUTED = 'COMPUTED',	// Property with computed value (execution time).
	MATERIALIZED_LITERAL = 'MATERIALIZED_LITERAL',  // Property value is a materialized literal.
	GETTER = 'GETTER',
	SETTER = 'SETTER',		// Property is an accessor function.
	PROTOTYPE = 'PROTOTYPE',	// Property is __proto__.
	SPREAD = 'SPREAD'
}
export class ObjectLiteralProperty {
	static Kind = ObjectLiteralPropertyKind;
}

enum ClassLiteralPropertyKind {
	METHOD = 'METHOD',
	GETTER = 'GETTER',
	SETTER = 'SETTER',
	FIELD = 'FIELD'
}

export class ClassLiteralProperty {
	static Kind = ClassLiteralPropertyKind;
}

function assertUnreachable(x: never): never {
	throw new Error(`Didn't expect to get here`);
}
export function classPropertyKindFor(kind: PropertyKind): ClassLiteralPropertyKind {
	switch (kind) {
		case PropertyKind.AccessorGetter:
			return ClassLiteralPropertyKind.GETTER;
		case PropertyKind.AccessorSetter:
			return ClassLiteralPropertyKind.SETTER;
		case PropertyKind.Method:
			return ClassLiteralPropertyKind.METHOD;
		case PropertyKind.ClassField:
			return ClassLiteralPropertyKind.FIELD;
	}
	throw new Error(`unexpected property kind: ${kind}`);
}

export enum VariableMode {
	Const = 'Const',
	PrivateMethod = 'PrivateMethod',
	PrivateGetterOnly = 'PrivateGetterOnly',
	PrivateSetterOnly = 'PrivateSetterOnly'
}

export function getVariableMode(kind: ClassLiteralPropertyKind): VariableMode {
	switch (kind) {
		case ClassLiteralPropertyKind.FIELD:
			return VariableMode.Const;
		case ClassLiteralPropertyKind.METHOD:
			return VariableMode.PrivateMethod;
		case ClassLiteralPropertyKind.GETTER:
			return VariableMode.PrivateGetterOnly;
		case ClassLiteralPropertyKind.SETTER:
			return VariableMode.PrivateSetterOnly;
	}
}

export class JavaScriptProgramParser extends JavaScriptParser {
	static parse(source: string | TokenExpression[] | TokenStream) {
		const stream = (typeof source === 'string' || Array.isArray(source))
			? TokenStream.getTokenStream(source)
			: source;
		const parser = new JavaScriptProgramParser(stream);
		return parser.scan();
	}

	static parseProgram(source: string | TokenExpression[] | TokenStream): Program {
		const stream = (typeof source === 'string' || Array.isArray(source))
			? TokenStream.getTokenStream(source)
			: source;
		const parser = new JavaScriptProgramParser(stream);
		return parser.doParseProgram();
	}
	protected doParseProgram(): Program {
		return new Program('module', []);
	}
	protected override parseNewTargetExpression(): ExpressionNode {
		this.consume(Token.PERIOD);
		const target: ExpressionNode = this.parsePropertyOrPrivatePropertyName();
		if (target.toString() !== 'target') {
			throw new Error(this.errorMessage(`Expression (new.${target.toString()}) not supported.`));
		}
		return MetaProperty.NewTarget;
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
		return new ClassExpression(classLiteral.getBody(), classLiteral.getDecorators(), classLiteral.getId()!, classLiteral.getSuperClass());
	}
	protected override parseClassDeclaration(names: string[] | undefined, defaultExport: boolean): ClassDeclaration {
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
		if (defaultExport && (nextToken == Token.EXTENDS || nextToken == Token.L_CURLY)) {
			name = new Literal('default');
			variableName = '.default';
		} else {
			const identifier = this.parseIdentifier();
			variableName = identifier.getName() as string;
			name = identifier;
		}
		const classLiteral = this.parseClassLiteral(name, isStrictReserved);
		return new ClassDeclaration(classLiteral.getBody(), classLiteral.getDecorators(), classLiteral.getId()!, classLiteral.getSuperClass());
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

		this.expect(Token.L_CURLY);

		const hasExtends = !!classInfo.extends;

		while (this.peek().isNotType(Token.R_CURLY)) {
			if (this.check(Token.SEMICOLON)) continue;

			// Either we're parsing a `static { }` initialization block or a property.
			if (this.peek().isType(Token.STATIC) && this.peekAhead().isType(Token.L_CURLY)) {
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

		this.expect(Token.R_CURLY);
		const classBody = this.rewriteClassLiteral(classInfo, name);
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
			if (this.peek().isType(Token.L_PARENTHESES)) {
				propInfo.kind = PropertyKind.Method;
				nameExpression = this.parseIdentifier();
				propInfo.name = (nameExpression as Identifier).getName() as string;
			} else if (this.peek().isType(Token.ASSIGN)
				|| this.peek().isType(Token.SEMICOLON)
				|| this.peek().isType(Token.R_BRACKETS)) {
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
					propInfo.isPrivate
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
					kind = hasExtends ? FunctionKind.DERIVED_CONSTRUCTOR : FunctionKind.BASE_CONSTRUCTOR;
				}

				const value = this.parseFunctionLiteral(
					kind,
					// nameExpression
					// ,kSkipFunctionNameCheck, kind, FunctionSyntaxKind.kAccessorOrMethod
				);

				const result = this.newClassLiteralProperty(
					nameExpression, value, ClassLiteralProperty.Kind.METHOD,
					propInfo.isStatic, propInfo.isComputedName,
					propInfo.isPrivate);
				this.setFunctionNameFromPropertyName(result, propInfo.name);
				return result;
			}

			case PropertyKind.AccessorGetter:
			case PropertyKind.AccessorSetter: {
				if (propInfo.funcFlag !== FunctionKind.NORMAL) {
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
					kind = isGet ? FunctionKind.STATIC_GETTER_FUNCTION
						: FunctionKind.STATIC_SETTER_FUNCTION;
				} else {
					kind = isGet ? FunctionKind.GETTER_FUNCTION
						: FunctionKind.SETTER_FUNCTION;
				}

				const value = this.parseFunctionLiteral(kind, /* nameExpression */);

				const propertyKind: ClassLiteralPropertyKind = isGet ? ClassLiteralProperty.Kind.GETTER : ClassLiteralProperty.Kind.SETTER;
				const result = this.newClassLiteralProperty(
					nameExpression, value, propertyKind,
					propInfo.isStatic, propInfo.isComputedName,
					propInfo.isPrivate);
				const prefix = isGet ? 'get ' : 'set ';
				this.setFunctionNameFromPropertyName(result, propInfo.name, prefix);
				return result;
			}
			case PropertyKind.Value:
			case PropertyKind.Shorthand:
			case PropertyKind.Spread:
				// throw new Error(this.errorMessage('Report Unexpected Token'));
				return NullNode;
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
			if (propInfo.funcFlag !== FunctionKind.NORMAL || isAccessor(propInfo.kind)) {
				if (propInfo.funcFlag === FunctionKind.GENERATOR) {
					throw new Error(this.errorMessage('constructor is generator'));
				} else if (propInfo.funcFlag === FunctionKind.ASYNC) {
					throw new Error(this.errorMessage('constructor is async'));
				}
				if (classInfo.hasSeenConstructor) {
					throw new Error(this.errorMessage('duplicate constructor'));
				}
			}
			classInfo.hasSeenConstructor = true;
		}
	}
	protected methodKindFor(isStatic: boolean, functionFlags: FunctionKind): FunctionKind {
		const isGenerator = functionFlags.includes('GENERATOR');
		const isAsync = functionFlags.includes('ASYNC');
		return functionKindForImpl(
			isStatic ? SubFunctionKind.StaticMethod : SubFunctionKind.NonStaticMethod,
			isGenerator,
			isAsync
		);
	}
	protected parseClassStaticBlock(classInfo: ClassInfo): StaticBlock {
		this.consume(Token.STATIC);
		// Each static block has its own var and lexical scope, so make a new var
		// block scope instead of using the synthetic members initializer function
		// scope.
		const block = this.parseBlock();
		classInfo.hasStaticElements = true;
		return new StaticBlock(block.getBody());
	}
	protected declareClass(variableName: string, value: ExpressionNode, names: string[] | undefined): ExpressionNode {
		names?.push(variableName);
		const proxy = this.declareVariable(variableName, 'let');
		return new AssignmentExpression('=', proxy, value);
	}
	protected declareVariable(name: string, mode: 'let' | 'const' | 'var') {
		return new VariableDeclarationNode([new VariableDeclarator(new Identifier(name))], mode);
	}
	protected newClassLiteralProperty(nameExpression: ExpressionNode, initializer: ExpressionNode | undefined, kind: ClassLiteralPropertyKind, isStatic: boolean, isComputedName: boolean, isPrivate: boolean) {
		switch (kind) {
			case ClassLiteralPropertyKind.METHOD:
				if (nameExpression.toString() === 'constructor') {
					return new MethodDefinition('constructor', nameExpression, initializer as FunctionExpression, [], isComputedName, isStatic);
				}
				return new MethodDefinition('method', nameExpression, initializer as FunctionExpression, [], isComputedName, isStatic);
			case ClassLiteralPropertyKind.SETTER:
				return new MethodDefinition('get', nameExpression, initializer as FunctionExpression, [], isComputedName, isStatic);
			case ClassLiteralPropertyKind.SETTER:
				return new MethodDefinition('set', nameExpression, initializer as FunctionExpression, [], isComputedName, isStatic);
			case ClassLiteralPropertyKind.FIELD:
				return new PropertyDefinition(nameExpression, [], isComputedName, isStatic, initializer);
			default:
				break;
		}
		throw new Error(this.errorMessage('UNREACHABLE'));
	}
	protected parseMemberInitializer(classInfo: ClassInfo, isStatic: boolean): ExpressionNode | undefined {
		const initializer = this.check(Token.ASSIGN) ? this.parseAssignmentExpression() : undefined;
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
		this.consume(Token.SUPER);
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
			return Super.INSTANCE;
		}
		throw new Error(this.errorMessage('Unexpected Super'));
	}
	protected rewriteClassLiteral(classInfo: ClassInfo, name?: ExpressionNode): ClassBody {
		const body: (MethodDefinition | PropertyDefinition | AccessorProperty | StaticBlock)[] = [];
		if (classInfo.hasSeenConstructor) {
			body.push(classInfo.constructor as MethodDefinition);
		}
		body.push(...classInfo.staticElements);
		body.push(...classInfo.instanceFields);
		body.push(...classInfo.publicMembers);
		body.push(...classInfo.privateMembers);
		return new ClassBody(body);
	}
	protected parseModuleItemList(body: ExpressionNode[]) {
		// ecma262/#prod-Module
		// Module :
		//    ModuleBody?
		//
		// ecma262/#prod-ModuleItemList
		// ModuleBody :
		//    ModuleItem*
		while (this.peek().isNotType(Token.EOS)) {
			const stat = this.parseModuleItem();
			if (!stat) {
				return;
			}
			if (this.isEmptyStatement(stat)) {
				continue;
			}
			body.push(stat);
		}
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
			if (peekAhead.isNotType(Token.L_PARENTHESES) && peekAhead.isNotType(Token.PERIOD)) {
				return this.parseImportDeclaration();
				// return factory() -> EmptyStatement();
			}
		}

		return this.parseStatementListItem();
	}

	protected expectContextualKeyword(tokenExp: TokenExpression, keyword: string) {
		return tokenExp.test((token, value) => Token.STRING.equal(token) && keyword === value?.toString());
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

		this.expect(Token.EXPORT);
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

			case Token.L_CURLY: {
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

				if (this.expectContextualKeyword(this.peek(), 'from')) {
					// Scanner::Location specifier_loc = scanner() -> peek_location();
					const moduleSpecifier = this.parseModuleSpecifier();
					const importAssertions = this.parseImportAssertClause();
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
				return new ExportNamedDeclaration([]);
				// return factory() -> EmptyStatement();
			}

			case Token.FUNCTION:
				result = this.parseFunctionDeclaration(false);
				break;

			case Token.CLASS:
				this.consume(Token.CLASS);
				result = this.parseClassDeclaration(names, false);
				break;

			case Token.VAR:
			case Token.LET:
			case Token.CONST:
				result = this.parseVariableStatement(names);
				break;

			case Token.ASYNC:
				this.consume(Token.ASYNC);
				if (this.peek().isType(Token.FUNCTION)
					// && !scanner() -> HasLineTerminatorBeforeNext()
				) {
					// result = this.parseAsyncFunctionDeclaration(names, false);
					result = this.parseHoistableDeclaration(FunctionKind.ASYNC, false);
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

		this.expect(Token.IMPORT);

		const tok = this.peek();

		// 'import' ModuleSpecifier ';'
		if (tok.isType(Token.STRING)) {
			// Scanner::Location specifier_loc = scanner() -> peek_location();
			const moduleSpecifier = this.parseModuleSpecifier();
			const importAssertions = this.parseImportAssertClause();
			this.expectSemicolon();

			// module() -> AddEmptyImport(module_specifier, import_assertions, specifier_loc,zone());
			return undefined;
		}

		// Parse ImportedDefaultBinding if present.
		let importDefaultBinding: string | undefined;
		// Scanner::Location import_default_binding_loc;
		if (tok.isNotType(Token.MUL) && tok.isNotType(Token.L_CURLY)) {
			importDefaultBinding = this.parseNonRestrictedIdentifier();
			// DeclareUnboundVariable(import_default_binding, VariableMode:: kConst,kNeedsInitialization, pos);
		}

		// Parse NameSpaceImport or NamedImports if present.
		let moduleNamespaceBinding: string | undefined;
		let namedImports: string[] | undefined;
		// Scanner::Location module_namespace_binding_loc;
		// const ZonePtrList<const NamedImport >* named_imports = nullptr;
		if (importDefaultBinding == undefined || this.check(Token.COMMA)) {
			switch (this.peek().token) {
				case Token.MUL: {
					this.consume(Token.MUL);
					if (this.expectContextualKeyword(this.peek(), 'as')) {

					}
					moduleNamespaceBinding = this.parseNonRestrictedIdentifier();
					// ExpectContextualKeyword(ast_value_factory() -> as_string());
					// module_namespace_binding = ParseNonRestrictedIdentifier();
					// module_namespace_binding_loc = scanner() -> location();
					// DeclareUnboundVariable(module_namespace_binding, VariableMode:: kConst, kCreatedInitialized, pos);
					break;
				}

				case Token.L_CURLY:
					namedImports = this.parseNamedImports();
					break;

				default:
					throw new SyntaxError(this.errorMessage('Unexpected Token'));
			}
		}
		if (this.expectContextualKeyword(this.peek(), 'from')) {

		}
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

		if (moduleNamespaceBinding) {
			// module() -> AddStarImport(module_namespace_binding, module_specifier, import_assertions, module_namespace_binding_loc, specifier_loc, zone());
		}

		if (importDefaultBinding) {
			// module() -> AddImport(ast_value_factory() -> default_string(), import_default_binding, module_specifier, import_assertions, import_default_binding_loc, specifier_loc, zone());
		}

		if (namedImports) {
			if (namedImports.length == 0) {
				// module() -> AddEmptyImport(module_specifier, import_assertions, specifier_loc, zone());
			} else {
				for (const namedImport of namedImports) {
					// module() -> AddImport(import -> import_name, import -> local_name, module_specifier, import_assertions, import -> location, specifier_loc, zone());
				}
			}
		}
		return undefined;
	}
	protected parseImportExpressions(): ExpressionNode {
		throw new Error(this.errorMessage('Expression (import) not supported.'));
	}
	protected parseVariableStatement(names: string[]): ExpressionNode | undefined {
		throw new Error('Method not implemented.');
	}
	protected parseImportAssertClause() {
		throw new Error('Method not implemented.');
	}
	protected parseModuleSpecifier() {
		throw new Error('Method not implemented.');
	}
	protected parseExportClause() {
		throw new Error('Method not implemented.');
	}
	protected parseExportStar(): ExpressionNode | undefined {
		throw new Error('Method not implemented.');
	}
	protected parseExportDefault(): ExpressionNode | undefined {
		throw new Error('Method not implemented.');
	}
	protected parseNamedImports(): string[] | undefined {
		throw new Error('Method not implemented.');
	}
	protected parseNonRestrictedIdentifier(): string | undefined {
		throw new Error('Method not implemented.');
	}

}
