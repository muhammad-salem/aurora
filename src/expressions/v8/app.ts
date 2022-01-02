// import type { CanDeclareExpression, ExpressionNode } from '../api/expression.js';
// import { JavaScriptParser, PropertyKind, PropertyKindInfo } from './parser.js';
// import { Token } from './token.js';
// import { MetaProperty } from '../api/app/class.js';
// import { FunctionKind } from '../api/definition/function.js';
// import { Identifier, Literal } from '../api/definition/values.js';
// import { AssignmentExpression } from '../api/operators/assignment.js';
// import { VariableDeclarationNode, VariableNode } from '../api/statement/declarations/declares.js';


// export type ClassInfo = {
// 	isAnonymous: boolean;
// 	extends: ExpressionNode;
// 	hasSeenConstructor: boolean;
// 	hasStaticComputedNames: boolean;
// 	requiresBrand: boolean;
// 	hasPrivateMethods: boolean,
// 	hasStaticPrivateMethods: boolean;
// 	computedFieldCount: number;
// 	hasStaticElements: boolean;
// };

// export enum FunctionNameValidity {
// 	FunctionNameIsStrictReserved = 'FunctionNameIsStrictReserved',
// 	SkipFunctionNameCheck = 'SkipFunctionNameCheck',
// 	FunctionNameValidityUnknown = 'FunctionNameValidityUnknown'
// };

// export enum AllowLabelledFunctionStatement {
// 	AllowLabelledFunctionStatement = 'AllowLabelledFunctionStatement',
// 	DisallowLabelledFunctionStatement = 'DisallowLabelledFunctionStatement',
// };

// export enum ParsingArrowHeadFlag {
// 	CertainlyNotArrowHead = 'CertainlyNotArrowHead',
// 	MaybeArrowHead = 'MaybeArrowHead'
// };

// export enum PropertyPosition {
// 	ObjectLiteral = 'ObjectLiteral',
// 	ClassLiteral = 'ClassLiteral'
// }

// const FUNCTIONS_TYPES: FunctionKind[][][] = [
// 	[
// 		// SubFunctionKind::kNormalFunction
// 		[// is_generator=false
// 			FunctionKind.NORMAL,
// 			FunctionKind.ASYNC
// 		],
// 		[// is_generator=true
// 			FunctionKind.GENERATOR,
// 			FunctionKind.ASYNC_GENERATOR
// 		],
// 	],
// 	[
// 		// SubFunctionKind::kNonStaticMethod
// 		[// is_generator=false
// 			FunctionKind.CONCISE,
// 			FunctionKind.ASYNC_CONCISE
// 		],
// 		[// is_generator=true
// 			FunctionKind.CONCISE_GENERATOR,
// 			FunctionKind.ASYNC_CONCISE_GENERATOR
// 		],
// 	],
// 	[
// 		// SubFunctionKind::kStaticMethod
// 		[// is_generator=false
// 			FunctionKind.STATIC_CONCISE,
// 			FunctionKind.STATIC_ASYNC_CONCISE
// 		],
// 		[// is_generator=true
// 			FunctionKind.STATIC_CONCISE_GENERATOR,
// 			FunctionKind.STATIC_ASYNC_CONCISE_GENERATOR
// 		],
// 	]
// ];

// export enum SubFunctionKind {
// 	NormalFunction,
// 	NonStaticMethod,
// 	StaticMethod,
// }

// export function functionKindForImpl(subFunctionKind: SubFunctionKind, isGenerator: boolean, isAsync: boolean): FunctionKind {
// 	return FUNCTIONS_TYPES[subFunctionKind as number][isGenerator ? 1 : 0][isAsync ? 1 : 0];
// }

// export class ParsePropertyInfo implements PropertyKindInfo {
// 	name: string;
// 	position = PropertyPosition.ClassLiteral;
// 	funcFlag = FunctionKind.NORMAL;
// 	kind = PropertyKind.NotSet;
// 	isComputedName = false;
// 	isPrivate = false;
// 	isStatic = false;
// 	isRest = false;

// 	PropertyKindFromToken(token: Token): boolean {
// 		// This returns true, setting the property kind, iff the given token is
// 		// one which must occur after a property name, indicating that the
// 		// previous token was in fact a name and not a modifier (like the "get" in
// 		// "get x").
// 		switch (token) {
// 			case Token.COLON:
// 				this.kind = PropertyKind.Value;
// 				return true;
// 			case Token.COMMA:
// 				this.kind = PropertyKind.Shorthand;
// 				return true;
// 			case Token.R_CURLY:
// 				this.kind = PropertyKind.ShorthandOrClassField;
// 				return true;
// 			case Token.ASSIGN:
// 				this.kind = PropertyKind.Assign;
// 				return true;
// 			case Token.L_PARENTHESES:
// 				this.kind = PropertyKind.Method;
// 				return true;
// 			case Token.MUL:
// 			case Token.SEMICOLON:
// 				this.kind = PropertyKind.ClassField;
// 				return true;
// 			default:
// 				break;
// 		}
// 		return false;
// 	}

// }
// enum ObjectLiteralPropertyKind {
// 	CONSTANT = 'CONSTANT',	// Property with constant value (compile time).
// 	COMPUTED = 'COMPUTED',	// Property with computed value (execution time).
// 	MATERIALIZED_LITERAL = 'MATERIALIZED_LITERAL',  // Property value is a materialized literal.
// 	GETTER = 'GETTER',
// 	SETTER = 'SETTER',		// Property is an accessor function.
// 	PROTOTYPE = 'PROTOTYPE',	// Property is __proto__.
// 	SPREAD = 'SPREAD'
// }
// export class ObjectLiteralProperty {
// 	static Kind = ObjectLiteralPropertyKind;
// }

// enum ClassLiteralPropertyKind {
// 	METHOD = 'METHOD',
// 	GETTER = 'GETTER',
// 	SETTER = 'SETTER',
// 	FIELD = 'FIELD'
// }

// export class ClassLiteralProperty {
// 	static Kind = ClassLiteralPropertyKind;
// }

// function assertUnreachable(x: never): never {
// 	throw new Error(`Didn't expect to get here`);
// }
// export function classPropertyKindFor(kind: PropertyKind): ClassLiteralPropertyKind {
// 	switch (kind) {
// 		case PropertyKind.AccessorGetter:
// 			return ClassLiteralPropertyKind.GETTER;
// 		case PropertyKind.AccessorSetter:
// 			return ClassLiteralPropertyKind.SETTER;
// 		case PropertyKind.Method:
// 			return ClassLiteralPropertyKind.METHOD;
// 		case PropertyKind.ClassField:
// 			return ClassLiteralPropertyKind.FIELD;
// 	}
// 	throw new Error(`unexpected property kind: ${kind}`);
// }

// export enum VariableMode {
// 	Const = 'Const',
// 	PrivateMethod = 'PrivateMethod',
// 	PrivateGetterOnly = 'PrivateGetterOnly',
// 	PrivateSetterOnly = 'PrivateSetterOnly'
// }

// export function getVariableMode(kind: ClassLiteralPropertyKind): VariableMode {
// 	switch (kind) {
// 		case ClassLiteralPropertyKind.FIELD:
// 			return VariableMode.Const;
// 		case ClassLiteralPropertyKind.METHOD:
// 			return VariableMode.PrivateMethod;
// 		case ClassLiteralPropertyKind.GETTER:
// 			return VariableMode.PrivateGetterOnly;
// 		case ClassLiteralPropertyKind.SETTER:
// 			return VariableMode.PrivateSetterOnly;
// 	}
// }

// export class JavaScriptAppParser extends JavaScriptParser {
// 	protected parseNewTargetExpression(): ExpressionNode {
// 		this.consume(Token.PERIOD);
// 		const target: ExpressionNode = this.parsePropertyName();
// 		if (target.toString() !== 'target') {
// 			throw new Error(this.errorMessage(`Expression (new.${target.toString()}) not supported.`));
// 		}
// 		return MetaProperty.NewTarget;
// 	}
// 	protected parseClassDeclaration(names: ExpressionNode[] | undefined, defaultExport: boolean): ExpressionNode {
// 		// ClassDeclaration ::
// 		//   'class' Identifier ('extends' LeftHandExpression)? '{' ClassBody '}'
// 		//   'class' ('extends' LeftHandExpression)? '{' ClassBody '}'
// 		//
// 		// The anonymous form is allowed iff [default_export] is true.
// 		//
// 		// 'class' is expected to be consumed by the caller.
// 		//
// 		// A ClassDeclaration
// 		//
// 		//   class C { ... }
// 		//
// 		// has the same semantics as:
// 		//
// 		//   let C = class C { ... };
// 		//
// 		// so rewrite it as such.

// 		const nextToken = this.peek().token;
// 		const isStrictReserved = Token.isStrictReservedWord(nextToken);
// 		let name: ExpressionNode | undefined;
// 		let variableName: ExpressionNode | undefined;
// 		if (defaultExport && (nextToken == Token.EXTENDS || nextToken == Token.L_CURLY)) {
// 			name = new Literal('default');
// 			variableName = new Literal('.default');
// 		} else {
// 			name = this.parseIdentifier();
// 			variableName = name;
// 		}
// 		const value = this.parseClassLiteral(name, isStrictReserved);
// 		return this.declareClass(variableName, value, names);
// 	}
// 	protected parseClassLiteral(name: ExpressionNode | undefined, nameIsStrictReserved: boolean): ExpressionNode {
// 		const isAnonymous = !!!name;

// 		// All parts of a ClassDeclaration and ClassExpression are strict code.
// 		if (!isAnonymous) {
// 			if (nameIsStrictReserved) {
// 				throw new Error(this.errorMessage(`Unexpected Strict Reserved class name`));
// 			}
// 			if (this.isEvalOrArguments(name!)) {
// 				throw new Error(this.errorMessage(`Strict Eval Arguments not allowed for class name`));
// 			}
// 		}

// 		// ClassScope * class_scope = NewClassScope(scope(), is_anonymous);
// 		// BlockState block_state(& scope_, class_scope);
// 		// RaiseLanguageMode(LanguageMode.kStrict);

// 		// BlockState object_literal_scope_state(& object_literal_scope_, nullptr);

// 		// ClassInfo classInfo(this);
// 		// classInfo.is_anonymous = is_anonymous;

// 		const classInfo = { isAnonymous, computedFieldCount: 0 } as ClassInfo;

// 		// scope() -> set_start_position(class_token_pos);
// 		if (this.check(Token.EXTENDS)) {
// 			// ClassScope.HeritageParsingScope heritage(class_scope);
// 			// FuncNameInferrerState fni_state(& fni_);
// 			// ExpressionParsingScope scope(impl());
// 			classInfo.extends = this.parseLeftHandSideExpression();
// 			// scope.ValidateExpression();
// 		}

// 		this.expect(Token.L_CURLY);

// 		const hasExtends = !(classInfo.extends === undefined);

// 		const staticBlockList: ExpressionNode[] = [];
// 		const privateClassMemberList: ExpressionNode[] = [];
// 		const publicClassFieldList: ExpressionNode[] = [];
// 		const publicClassMethodList: ExpressionNode[] = [];

// 		while (this.peek().isNotType(Token.R_CURLY)) {
// 			if (this.check(Token.SEMICOLON)) continue;

// 			// Either we're parsing a `static { }` initialization block or a property.
// 			if (this.peek().isType(Token.STATIC) && this.peekAhead().isType(Token.L_CURLY)) {
// 				const staticBlock = this.parseClassStaticBlock(classInfo);
// 				staticBlockList.push(staticBlock);
// 				continue;
// 			}

// 			// FuncNameInferrerState fni_state(& fni_);
// 			// If we haven't seen the constructor yet, it potentially is the next
// 			// property.
// 			let isConstructor = !classInfo.hasSeenConstructor;
// 			const propInfo = new ParsePropertyInfo();
// 			propInfo.position = PropertyPosition.ClassLiteral;

// 			const property = this.parseClassPropertyDefinition(classInfo, propInfo, hasExtends);

// 			// if (has_error()) return impl() -> FailureExpression();

// 			const propertyKind = classPropertyKindFor(propInfo.kind);
// 			if (!classInfo.hasStaticComputedNames && propInfo.isStatic && propInfo.isComputedName) {
// 				classInfo.hasStaticComputedNames = true;
// 			}
// 			isConstructor &&= classInfo.hasSeenConstructor;

// 			const isField = propertyKind == ClassLiteralPropertyKind.FIELD;

// 			if (propInfo.isPrivate) {
// 				if (isConstructor) {
// 					throw new Error(this.errorMessage('private constructor is not allowed'));
// 				}
// 				classInfo.requiresBrand ||= (!isField && !propInfo.isStatic);
// 				const isMethod = propertyKind == ClassLiteralPropertyKind.METHOD;
// 				classInfo.hasPrivateMethods ||= isMethod;
// 				classInfo.hasStaticPrivateMethods ||= isMethod && propInfo.isStatic;
// 				const privateClassMember = this.declarePrivateClassMember(propInfo.name, property, propertyKind, propInfo.isStatic, classInfo);
// 				privateClassMemberList.push(privateClassMember);
// 				continue;
// 			}

// 			if (isField) {
// 				if (propInfo.isComputedName) {
// 					classInfo.computedFieldCount++;
// 				}
// 				const publicClassField = this.declarePublicClassField(property, propInfo.isStatic, propInfo.isComputedName, classInfo);
// 				publicClassFieldList.push(publicClassField);
// 				continue;
// 			}

// 			const publicClassMethod = this.declarePublicClassMethod(name, property, isConstructor, classInfo);
// 			publicClassMethodList.push(publicClassMethod);
// 		}

// 		this.expect(Token.R_CURLY);
// 		// int end_pos = end_position();
// 		// class_scope -> set_end_position(end_pos);

// 		// VariableProxy * unresolvable = class_scope -> ResolvePrivateNamesPartially();
// 		// if (unresolvable != nullptr) {
// 		// 	impl() -> ReportMessageAt(Scanner.Location(unresolvable -> position(),unresolvable -> position() + 1),
// 		// 		MessageTemplate.kInvalidPrivateFieldResolution,
// 		// 		unresolvable -> raw_name());
// 		// 	return impl() -> FailureExpression();
// 		// }

// 		// if (classInfo.requiresBrand) {
// 		// 	class_scope -> DeclareBrandVariable(ast_value_factory(), IsStaticFlag.kNotStatic, kNoSourcePosition);
// 		// }

// 		// if (class_scope -> needs_home_object()) {
// 		// 	classInfo.homeObjectVariable = class_scope -> DeclareHomeObjectVariable(ast_value_factory());
// 		// 	classInfo.staticHomeObjectVariable = class_scope -> DeclareStaticHomeObjectVariable(ast_value_factory());
// 		// }

// 		// bool should_save_class_variable_index = class_scope -> should_save_class_variable_index();
// 		// if (!isAnonymous || should_save_class_variable_index) {
// 		// 	this.declareClassVariable(name, classInfo);
// 		// 	if (should_save_class_variable_index) {
// 		// 		class_scope -> class_variable() -> set_is_used();
// 		// 		class_scope -> class_variable() -> ForceContextAllocation();
// 		// 	}
// 		// }
// 		return this.rewriteClassLiteral(name, classInfo);
// 	}
// 	protected declarePublicClassMethod(name: ExpressionNode | undefined, property: ExpressionNode, isConstructor: boolean, classInfo: ClassInfo): ExpressionNode {
// 		throw new Error('Method not implemented.');
// 	}
// 	protected declarePublicClassField(property: ExpressionNode, isStatic: boolean, isComputedName: boolean, classInfo: ClassInfo): ExpressionNode {
// 		throw new Error('Method not implemented.');
// 	}
// 	protected inferFunctionName() {
// 		throw new Error('Method not implemented.');
// 	}
// 	protected declarePrivateClassMember(name: string, property: ExpressionNode, propertyKind: ClassLiteralPropertyKind, isStatic: boolean, classInfo: ClassInfo): ExpressionNode {
// 		throw new Error('Method not implemented.');
// 	}
// 	protected parseClassPropertyDefinition(classInfo: ClassInfo, propInfo: ParsePropertyInfo, hasExtends: boolean): ExpressionNode {
// 		if (!classInfo) {
// 			throw new Error(this.errorMessage('class info is undefined'));
// 		}
// 		if (propInfo.position !== PropertyPosition.ClassLiteral) {
// 			throw new Error(this.errorMessage('expected property position ClassLiteral'));
// 		}

// 		const nameToken = this.peek();
// 		let nameExpression: ExpressionNode;
// 		if (nameToken.isType(Token.STATIC)) {
// 			this.consume(Token.STATIC);
// 			if (this.peek().isType(Token.L_PARENTHESES)) {
// 				propInfo.kind = PropertyKind.Method;
// 				nameExpression = this.parseIdentifier();
// 				propInfo.name = (nameExpression as Identifier).getName() as string;
// 			} else if (this.peek().isType(Token.ASSIGN)
// 				|| this.peek().isType(Token.SEMICOLON)
// 				|| this.peek().isType(Token.R_BRACKETS)) {
// 				nameExpression = this.parseIdentifier();
// 				propInfo.name = (nameExpression as Identifier).getName() as string;
// 			} else {
// 				propInfo.isStatic = true;
// 				nameExpression = this.parseProperty(propInfo);
// 			}
// 		} else {
// 			nameExpression = this.parseProperty(propInfo);
// 		}

// 		switch (propInfo.kind) {
// 			case PropertyKind.Assign:
// 			case PropertyKind.ClassField:
// 			case PropertyKind.ShorthandOrClassField:
// 			case PropertyKind.NotSet: {
// 				// This case is a name followed by a
// 				// name or other property. Here we have
// 				// to assume that's an uninitialized
// 				// field followed by a line break
// 				// followed by a property, with ASI
// 				// adding the semicolon. If not, there
// 				// will be a syntax error after parsing
// 				// the first name as an uninitialized
// 				// field.
// 				propInfo.kind = PropertyKind.ClassField;

// 				// if (!propInfo.isComputedName) {
// 				// 	this.checkClassFieldName(propInfo.name, propInfo.isStatic);
// 				// }

// 				const initializer: ExpressionNode = this.parseMemberInitializer(classInfo, propInfo.isStatic);
// 				this.expectSemicolon();

// 				const result: ExpressionNode = this.newClassLiteralProperty(
// 					nameExpression,
// 					initializer,
// 					ClassLiteralPropertyKind.FIELD,
// 					propInfo.isStatic,
// 					propInfo.isComputedName,
// 					propInfo.isPrivate
// 				);
// 				this.setFunctionNameFromPropertyName(result, propInfo.name);
// 				return result;
// 			}
// 			case PropertyKind.Method: {
// 				// MethodDefinition
// 				//    PropertyName '(' StrictFormalParameters ')' '{' FunctionBody '}'
// 				//    '*' PropertyName '(' StrictFormalParameters ')' '{' FunctionBody '}'
// 				//    async PropertyName '(' StrictFormalParameters ')'
// 				//        '{' FunctionBody '}'
// 				//    async '*' PropertyName '(' StrictFormalParameters ')'
// 				//        '{' FunctionBody '}'

// 				// if (!propInfo.isComputedName) {
// 				// 	this.checkClassMethodName(propInfo.name, PropertyKind.Method,propInfo.functionFlags, propInfo.isStatic,classInfo . hasSeenConstructor);
// 				// }

// 				let kind: FunctionKind = this.methodKindFor(propInfo.isStatic, propInfo.funcFlag);

// 				if (!propInfo.isStatic && propInfo.name.toString() === 'constructor') {
// 					classInfo.hasSeenConstructor = true;
// 					kind = hasExtends ? FunctionKind.DERIVED_CONSTRUCTOR : FunctionKind.BASE_CONSTRUCTOR;
// 				}

// 				const value = this.parseFunctionLiteral(
// 					kind,
// 					propInfo.name
// 					// ,kSkipFunctionNameCheck, kind, FunctionSyntaxKind.kAccessorOrMethod
// 				);

// 				ClassLiteralPropertyT result = factory() -> NewClassLiteralProperty(
// 					name_expression, value, ClassLiteralProperty.METHOD,
// 					propInfo.is_static, propInfo.is_computed_name,
// 					propInfo.is_private);
// 				this.setFunctionNameFromPropertyName(result, propInfo.name);
// 				return result;
// 			}

// 			case PropertyKind.AccessorGetter:
// 			case PropertyKind.AccessorSetter: {
// 				DCHECK_EQ(propInfo.function_flags, ParseFunctionFlag.kIsNormal);
// 				bool is_get = propInfo.kind == PropertyKind.kAccessorGetter;

// 				if (!propInfo.is_computed_name) {
// 					CheckClassMethodName(propInfo.name, propInfo.kind,
// 						ParseFunctionFlag.kIsNormal, propInfo.is_static,
//                              & class_info -> has_seen_constructor);
// 					// Make sure the name expression is a string since we need a Name for
// 					// Runtime_DefineAccessorPropertyUnchecked and since we can determine
// 					// this statically we can skip the extra runtime check.
// 					name_expression = factory() -> NewStringLiteral(
// 						propInfo.name, name_expression -> position());
// 				}

// 				let kind: FunctionKind;
// 				if (propInfo.is_static) {
// 					kind = is_get ? FunctionKind.StaticGetterFunction
// 						: FunctionKind.StaticSetterFunction;
// 				} else {
// 					kind = is_get ? FunctionKind.GetterFunction
// 						: FunctionKind.SetterFunction;
// 				}

// 				FunctionLiteralT value = impl() -> ParseFunctionLiteral(
// 					propInfo.name, scanner() -> location(), kSkipFunctionNameCheck, kind,
// 					name_token_position, FunctionSyntaxKind.kAccessorOrMethod,
// 					language_mode(), nullptr);

// 				ClassLiteralPropertyKind property_kind =
// 					is_get ? ClassLiteralProperty.GETTER : ClassLiteralProperty.SETTER;
// 				ClassLiteralPropertyT result = factory() -> NewClassLiteralProperty(
// 						name_expression, value, property_kind, propInfo.is_static,
// 						propInfo.is_computed_name, propInfo.is_private);
// 				const AstRawString* prefix =
// 				is_get ? ast_value_factory() -> get_space_string()
// 					: ast_value_factory() -> set_space_string();
// 				this.setFunctionNameFromPropertyName(result, propInfo.name, prefix);
// 				return result;
// 			}
// 			case PropertyKind.Value:
// 			case PropertyKind.Shorthand:
// 			case PropertyKind.Spread:
// 				// throw new Error(this.errorMessage('Report Unexpected Token'));
// 				return NullNode;
// 		}
// 		throw new Error(this.errorMessage('UNREACHABLE'));
// 	}
// 	setFunctionNameFromPropertyName(property: LiteralProperty, name: string, prefix?: string): void {
// 		// Ignore "__proto__" as a name when it's being used to set the [[Prototype]]
// 		// of an object literal.
// 		// See ES #sec-__proto__-property-names-in-object-initializers.

// 		if (property instanceof Identifier && property.getName() === '__proto__') {
// 			return;
// 		}

// 		// if (property -> IsPrototype() || has_error()) return;

// 		// DCHECK(!property -> value() -> IsAnonymousFunctionDefinition() ||
// 		// 	property -> kind() == ObjectLiteralProperty:: COMPUTED);

// 		// SetFunctionNameFromPropertyName(static_cast < LiteralProperty *> (property), name,
// 		// 	prefix);
// 	}
// 	protected methodKindFor(isStatic: boolean, functionFlags: FunctionKind): FunctionKind {
// 		const isGenerator = functionFlags.includes('GENERATOR');
// 		const isAsync = functionFlags.includes('ASYNC');
// 		return functionKindForImpl(
// 			isStatic ? SubFunctionKind.StaticMethod : SubFunctionKind.NonStaticMethod,
// 			isGenerator,
// 			isAsync
// 		);
// 	}
// 	newClassLiteralProperty(nameExpression: ExpressionNode, initializer: ExpressionNode, FIELD: ClassLiteralPropertyKind, isStatic: boolean, isComputedName: boolean, isPrivate: boolean): ExpressionNode {
// 		throw new Error('Method not implemented.');
// 	}
// 	parseMemberInitializer(classInfo: ClassInfo, isStatic: boolean): ExpressionNode {
// 		throw new Error('Method not implemented.');
// 	}
// 	protected parseClassStaticBlock(classInfo: ClassInfo): ExpressionNode {
// 		this.consume(Token.STATIC);
// 		// Each static block has its own var and lexical scope, so make a new var
// 		// block scope instead of using the synthetic members initializer function
// 		// scope.
// 		const staticBlock = this.parseBlock();
// 		classInfo.hasStaticElements = true;
// 		return staticBlock;

// 	}
// 	protected declareClass(variableName: ExpressionNode | undefined, value: ExpressionNode, names: ExpressionNode[] | undefined): ExpressionNode {
// 		if (names && variableName) {
// 			const proxy = this.declareVariable(variableName, 'let');
// 			names.push(variableName);
// 			return new AssignmentExpression('=', proxy, value);
// 		}
// 		return value;
// 	}
// 	protected parseSuperExpression(): ExpressionNode {
// 		throw new Error(this.errorMessage('Expression (supper) not supported.'));
// 	}
// 	protected parseImportExpressions(): ExpressionNode {
// 		throw new Error(this.errorMessage('Expression (import) not supported.'));
// 	}
// 	protected declareVariable(name: ExpressionNode | undefined, mode: 'let' | 'const' | 'var') {
// 		if (!name) {
// 			throw new Error(this.errorMessage('Variable name is undefined'));
// 		}
// 		switch (mode) {
// 			case 'const':
// 				return new VariableDeclarationNode([new VariableNode(name as CanDeclareExpression)], 'const');
// 			default:
// 			case 'var':
// 				return new VariableDeclarationNode([new VariableNode(name as CanDeclareExpression)], 'var');
// 			case 'let':
// 				return new VariableDeclarationNode([new VariableNode(name as CanDeclareExpression)], 'let');
// 		}
// 	}
// }
