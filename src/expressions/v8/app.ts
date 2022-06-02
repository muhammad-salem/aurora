import type { CanDeclareExpression, ExpressionNode } from '../api/expression.js';
import { isAccessor, JavaScriptParser, PropertyKind, PropertyKindInfo } from './parser.js';
import { Token } from './token.js';
import { AccessorProperty, ClassBody, ClassDeclaration, ClassExpression, MetaProperty, MethodDefinition, PropertyDefinition, StaticBlock, Super } from '../api/class/class.js';
import { FunctionExpression, FunctionKind } from '../api/definition/function.js';
import { Identifier, Literal, NullishLiteral, NullNode, StringLiteral, UndefinedNode } from '../api/definition/values.js';
import { AssignmentExpression } from '../api/operators/assignment.js';
import { VariableDeclarationNode, VariableDeclarator } from '../api/statement/declarations/declares.js';


export type ClassInfo = {
	extends?: ExpressionNode;
	publicMembers: (MethodDefinition | PropertyDefinition)[],
	privateMembers: (MethodDefinition | PropertyDefinition)[],
	staticElements: (MethodDefinition | PropertyDefinition | AccessorProperty | StaticBlock)[],
	instanceFields: (MethodDefinition | PropertyDefinition | AccessorProperty)[],
	constructor: MethodDefinition | NullishLiteral,

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
		'constructor': NullNode,

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


export enum PropertyPosition {
	ObjectLiteral = 'ObjectLiteral',
	ClassLiteral = 'ClassLiteral'
}

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

export class ParsePropertyInfo implements PropertyKindInfo {
	name: string;
	position = PropertyPosition.ClassLiteral;
	funcFlag = FunctionKind.NORMAL;
	kind = PropertyKind.NotSet;
	isComputedName = false;
	isPrivate = false;
	isStatic = false;
	isRest = false;

	PropertyKindFromToken(token: Token): boolean {
		// This returns true, setting the property kind, iff the given token is
		// one which must occur after a property name, indicating that the
		// previous token was in fact a name and not a modifier (like the "get" in
		// "get x").
		switch (token) {
			case Token.COLON:
				this.kind = PropertyKind.Value;
				return true;
			case Token.COMMA:
				this.kind = PropertyKind.Shorthand;
				return true;
			case Token.R_CURLY:
				this.kind = PropertyKind.ShorthandOrClassField;
				return true;
			case Token.ASSIGN:
				this.kind = PropertyKind.Assign;
				return true;
			case Token.L_PARENTHESES:
				this.kind = PropertyKind.Method;
				return true;
			case Token.MUL:
			case Token.SEMICOLON:
				this.kind = PropertyKind.ClassField;
				return true;
			default:
				break;
		}
		return false;
	}

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

export class JavaScriptAppParser extends JavaScriptParser {
	protected override parseNewTargetExpression(): ExpressionNode {
		this.consume(Token.PERIOD);
		const target: ExpressionNode = this.parsePropertyName();
		if (target.toString() !== 'target') {
			throw new Error(this.errorMessage(`Expression (new.${target.toString()}) not supported.`));
		}
		return MetaProperty.NewTarget;
	}
	protected override parseClassDeclaration(names: ExpressionNode[] | undefined, defaultExport: boolean): ExpressionNode {
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
		let variableName: ExpressionNode | undefined;
		if (defaultExport && (nextToken == Token.EXTENDS || nextToken == Token.L_CURLY)) {
			name = new Literal('default');
			variableName = new Literal('.default');
		} else {
			name = this.parseIdentifier();
			variableName = name;
		}
		const value = this.parseClassLiteral(name, isStrictReserved);
		return this.declareClass(variableName, value, names);
	}
	protected override parseClassLiteral(name: ExpressionNode | undefined, nameIsStrictReserved: boolean): ExpressionNode {
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

		// const staticBlockList: ExpressionNode[] = [];
		// const privateClassMemberList: ExpressionNode[] = [];
		// const publicClassFieldList: ExpressionNode[] = [];
		// const publicClassMethodList: ExpressionNode[] = [];

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
			const propInfo = new ParsePropertyInfo();
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
		return this.rewriteClassLiteral(classInfo, name);
	}
	protected declarePublicClassMethod(name: ExpressionNode | undefined, property: MethodDefinition, isConstructor: boolean, classInfo: ClassInfo): void {
		// throw new Error('Method not implemented.');
		if (isConstructor) {
			if (classInfo.constructor) {
				throw new SyntaxError('A class may only have one constructor.');
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

		if (isComputedName) {
			// We create a synthetic variable name here so that scope
			// analysis doesn't dedupe the vars.
			// Variable * computed_name_var =
			// CreateSyntheticContextVariable(ClassFieldVariableName(ast_value_factory(), classinfo . computed_field_count));
			// property . set_computed_name_var(computed_name_var);
			classInfo.publicMembers.push(property);
		}

	}
	protected declarePrivateClassMember(propertyName: string, property: MethodDefinition | PropertyDefinition, kind: ClassLiteralPropertyKind, isStatic: boolean, classInfo: ClassInfo) {
		if (ClassLiteralPropertyKind.FIELD == kind) {
			if (isStatic) {
				classInfo.staticElements.push(property);
			} else {
				classInfo.instanceFields.push(property);
			}
		}
		// const privateNameVar = this.createPrivateNameVariable(
		// 	getVariableMode(kind),
		// 	isStatic ? StaticFlag.Static : StaticFlag.NotStatic,
		// 	propertyName
		// );
		classInfo.privateMembers.push(property);
	}
	// protected createPrivateNameVariable(mode: VariableMode, staticFlag: StaticFlag, propertyName: string) {
	// 	throw new Error('Method not implemented.');
	// }
	protected parseClassPropertyDefinition(classInfo: ClassInfo, propInfo: ParsePropertyInfo, hasExtends: boolean) {
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

				const initializer: ExpressionNode = this.parseMemberInitializer(classInfo, propInfo.isStatic);
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
					nameExpression
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
					nameExpression = new StringLiteral(propInfo.name);
				}

				let kind: FunctionKind;
				if (propInfo.isStatic) {
					kind = isGet ? FunctionKind.STATIC_GETTER_FUNCTION
						: FunctionKind.STATIC_SETTER_FUNCTION;
				} else {
					kind = isGet ? FunctionKind.GETTER_FUNCTION
						: FunctionKind.SETTER_FUNCTION;
				}

				const value = this.parseFunctionLiteral(kind, nameExpression);

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
	protected checkClassMethodName(propInfo: ParsePropertyInfo, classInfo: ClassInfo) {
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
	protected declareClass(variableName: ExpressionNode | undefined, value: ExpressionNode, names: ExpressionNode[] | undefined): ExpressionNode {
		if (names && variableName) {
			const proxy = this.declareVariable(variableName, 'let');
			names.push(variableName);
			return new AssignmentExpression('=', proxy, value);
		}
		return value;
	}

	protected declareVariable(name: ExpressionNode | undefined, mode: 'let' | 'const' | 'var') {
		if (!name) {
			throw new Error(this.errorMessage('Variable name is undefined'));
		}
		return new VariableDeclarationNode([new VariableDeclarator(name as CanDeclareExpression)], mode);
	}
	protected newClassLiteralProperty(nameExpression: ExpressionNode, initializer: ExpressionNode, kind: ClassLiteralPropertyKind, isStatic: boolean, isComputedName: boolean, isPrivate: boolean) {
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
	protected parseMemberInitializer(classInfo: ClassInfo, isStatic: boolean): ExpressionNode {
		const initializer: ExpressionNode = this.check(Token.ASSIGN) ? this.parseAssignmentExpression() : UndefinedNode;
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
	protected rewriteClassLiteral(classInfo: ClassInfo, name?: ExpressionNode): ClassExpression {
		// const hasDefaultConstructor = !classInfo.hasSeenConstructor;
		// // Account for the default constructor.
		// if (hasDefaultConstructor) {
		// 	const hasExtends = !!classInfo.extends;
		// 	const kind = hasExtends ? FunctionKind.DEFAULT_DERIVED_CONSTRUCTOR : FunctionKind.DEFAULT_BASE_CONSTRUCTOR;
		// }
		// if (classInfo.hasStaticElements) {
		// }
		// if (classInfo.hasInstanceMembers) {
		// }
		const hasExtends = !!classInfo.extends;
		const hasDefaultConstructor = !classInfo.hasSeenConstructor;
		if (hasDefaultConstructor) {
			// ignore setting default constructor for now
			// classInfo.constructor = DefaultConstructor(name, has_extends);
		}


		//   bool has_extends = classInfo ->extends != nullptr;
		//   bool has_default_constructor = classInfo -> constructor == nullptr;
		// 		if (has_default_constructor) {
		// 			classInfo -> constructor =
		// 			DefaultConstructor(name, has_extends, pos, end_pos);
		// 		}

		// if (name != nullptr) {
		// 	DCHECK_NOT_NULL(block_scope -> class_variable());
		// 	block_scope -> class_variable() -> set_initializer_position(end_pos);
		// }

		// FunctionLiteral * static_initializer = nullptr;
		// if (classInfo -> has_static_elements) {
		// 	static_initializer = CreateInitializerFunction(
		// 		"<static_initializer>", classInfo -> static_elements_scope,
		// 		factory() -> NewInitializeClassStaticElementsStatement(
		// 			classInfo -> static_elements, kNoSourcePosition));
		// }

		// FunctionLiteral * instance_members_initializer_function = nullptr;
		// if (classInfo -> has_instance_members) {
		// 	instance_members_initializer_function = CreateInitializerFunction(
		// 		"<instance_members_initializer>", classInfo -> instance_members_scope,
		// 		factory() -> NewInitializeClassMembersStatement(
		// 			classInfo -> instance_fields, kNoSourcePosition));
		// 	classInfo -> constructor -> set_requires_instance_members_initializer(true);
		// 	classInfo -> constructor -> add_expected_properties(
		// 		classInfo -> instance_fields -> length());
		// }

		// if (classInfo -> requires_brand) {
		// 	classInfo -> constructor -> set_class_scope_has_private_brand(true);
		// }
		// if (classInfo -> has_static_private_methods) {
		// 	classInfo -> constructor -> set_has_static_private_methods_or_accessors(true);
		// }
		// ClassLiteral * class_literal = factory() -> NewClassLiteral(
		// 	block_scope, classInfo ->extends, classInfo -> constructor,
		// 	classInfo -> public_members, classInfo -> private_members,
		// 	static_initializer, instance_members_initializer_function, pos, end_pos,
		// 	classInfo -> has_static_computed_names, classInfo -> is_anonymous,
		// 	classInfo -> has_private_methods, classInfo -> home_object_variable,
		// 	classInfo -> static_home_object_variable);

		// AddFunctionForNameInference(classInfo -> constructor);
		// return class_literal;
		const body: (MethodDefinition | PropertyDefinition | AccessorProperty | StaticBlock)[] = [];

		if (classInfo.hasSeenConstructor) {
			body.push(classInfo.constructor as MethodDefinition);
		}
		body.push(...classInfo.staticElements);
		body.push(...classInfo.privateMembers);
		body.push(...classInfo.instanceFields);
		body.push(...classInfo.publicMembers);
		if (name) {
			return new ClassDeclaration(new ClassBody(body), [], name as Identifier, classInfo.extends);
		}
		return new ClassExpression(new ClassBody(body), [], name, classInfo.extends);
	}
	protected parseImportExpressions(): ExpressionNode {
		throw new Error(this.errorMessage('Expression (import) not supported.'));
	}
}
