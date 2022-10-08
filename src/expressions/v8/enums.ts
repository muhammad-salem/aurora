import { AccessorProperty, MethodDefinition, PropertyDefinition, StaticBlock } from '../api/class/class.js';
import { ExpressionNode } from '../api/expression.js';
import { VariableDeclarator } from '../api/statement/declarations/declares.js';
import { Token } from './token.js';

export function isInRange(num: number, start: number, end: number) {
	return num >= start && num <= end;
}

export enum ParsingArrowHeadFlag { CertainlyNotArrowHead, MaybeArrowHead, AsyncArrowFunction }
export enum PropertyKind {
	Value, Shorthand, ShorthandOrClassField,
	Assign, Method, ClassField, AccessorGetter, AccessorSetter,
	Spread, NotSet
}
export function isAccessor(kind: PropertyKind) {
	return kind === PropertyKind.AccessorGetter || kind === PropertyKind.AccessorSetter;
}

export enum PropertyPosition {
	ObjectLiteral,
	ClassLiteral
}

export class PropertyKindInfo {
	name: string;
	position = PropertyPosition.ClassLiteral;
	funcFlag = ParseFunctionFlag.IsNormal;
	kind = PropertyKind.NotSet;
	isComputedName = false;
	isPrivate = false;
	isStatic = false;
	isRest = false;

	parsePropertyKindFromToken(token: Token): boolean {
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
			case Token.RBRACE:
				this.kind = PropertyKind.ShorthandOrClassField;
				return true;
			case Token.ASSIGN:
				this.kind = PropertyKind.Assign;
				return true;
			case Token.LPAREN:
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

export type FunctionInfo = { rest?: boolean };

export enum PreParserIdentifierType {
	NullIdentifier,
	UnknownIdentifier,
	EvalIdentifier,
	ArgumentsIdentifier,
	ConstructorIdentifier,
	AwaitIdentifier,
	AsyncIdentifier,
	NameIdentifier,
	PrivateNameIdentifier
}

export enum FunctionBodyType {
	EXPRESSION,
	BLOCK,
}

export enum ParseFunctionFlag {
	IsNormal = 0,
	IsGenerator = 1 << 0,
	IsAsync = 1 << 1
}

export enum FunctionKind {

	// BEGIN constructable functions
	NormalFunction,
	Module,
	AsyncModule,
	// BEGIN class constructors
	// BEGIN base constructors
	BaseConstructor,
	// BEGIN default constructors
	DefaultBaseConstructor,
	// END base constructors
	// BEGIN derived constructors
	DefaultDerivedConstructor,
	// END default constructors
	DerivedConstructor,
	// END derived constructors
	// END class constructors
	// END constructable functions.
	// BEGIN accessors
	GetterFunction,
	StaticGetterFunction,
	SetterFunction,
	StaticSetterFunction,
	// END accessors
	// BEGIN arrow functions
	ArrowFunction,
	// BEGIN async functions
	AsyncArrowFunction,
	// END arrow functions
	AsyncFunction,
	// BEGIN concise methods 1
	AsyncConciseMethod,
	StaticAsyncConciseMethod,
	// BEGIN generators
	AsyncConciseGeneratorMethod,
	StaticAsyncConciseGeneratorMethod,
	// END concise methods 1
	AsyncGeneratorFunction,
	// END async functions
	GeneratorFunction,
	// BEGIN concise methods 2
	ConciseGeneratorMethod,
	StaticConciseGeneratorMethod,
	// END generators
	ConciseMethod,
	StaticConciseMethod,
	ClassMembersInitializerFunction,
	ClassStaticInitializerFunction,
	// END concise methods 2
	Invalid,

	LastFunctionKind = ClassStaticInitializerFunction,
}

const FUNCTIONS_TYPES: FunctionKind[][][] = [
	[
		// SubFunctionKind::kNormalFunction
		[// is_generator=false
			FunctionKind.NormalFunction,
			FunctionKind.AsyncFunction
		],
		[// is_generator=true
			FunctionKind.GeneratorFunction,
			FunctionKind.AsyncGeneratorFunction
		],
	],
	[
		// SubFunctionKind::kNonStaticMethod
		[// is_generator=false
			FunctionKind.ConciseMethod,
			FunctionKind.AsyncConciseMethod
		],
		[// is_generator=true
			FunctionKind.ConciseGeneratorMethod,
			FunctionKind.AsyncConciseGeneratorMethod
		],
	],
	[
		// SubFunctionKind::kStaticMethod
		[// is_generator=false
			FunctionKind.StaticConciseMethod,
			FunctionKind.StaticAsyncConciseMethod
		],
		[// is_generator=true
			FunctionKind.StaticConciseGeneratorMethod,
			FunctionKind.StaticAsyncConciseGeneratorMethod
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


export function functionKindForImpl(subFunctionKind: SubFunctionKind, flags: ParseFunctionFlag): FunctionKind {
	return FUNCTIONS_TYPES[subFunctionKind]
	[(flags & ParseFunctionFlag.IsGenerator) != 0 ? 1 : 0]
	[(flags & ParseFunctionFlag.IsAsync) != 0 ? 1 : 0];
}

export function functionKindFor(isGenerator: boolean, isAsync: boolean): FunctionKind {
	return FUNCTIONS_TYPES[SubFunctionKind.NormalFunction][isGenerator ? 1 : 0][isAsync ? 1 : 0];
}

export function methodKindFor(isStatic: boolean, isGenerator: boolean, isAsync: boolean): FunctionKind {
	return FUNCTIONS_TYPES[isStatic ? SubFunctionKind.StaticMethod : SubFunctionKind.NonStaticMethod][isGenerator ? 1 : 0][isAsync ? 1 : 0];
}

export enum FunctionSyntaxKind {
	AnonymousExpression,
	NamedExpression,
	Declaration,
	AccessorOrMethod,
	Wrapped,

	LastFunctionSyntaxKind = Wrapped,
};



export function isArrowFunction(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.ArrowFunction, FunctionKind.AsyncArrowFunction);
}

export function isModule(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.Module, FunctionKind.AsyncModule);
}

export function isAsyncModule(kind: FunctionKind) {
	return kind == FunctionKind.AsyncModule;
}

export function isAsyncGeneratorFunction(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.AsyncConciseGeneratorMethod, FunctionKind.AsyncGeneratorFunction);
}

export function isGeneratorFunction(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.AsyncConciseGeneratorMethod, FunctionKind.StaticConciseGeneratorMethod);
}

export function isAsyncFunction(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.AsyncArrowFunction, FunctionKind.AsyncGeneratorFunction);
}

export function isResumableFunction(kind: FunctionKind) {
	return isGeneratorFunction(kind) || isAsyncFunction(kind) || isModule(kind);
}

export function isConciseMethod(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.AsyncConciseMethod, FunctionKind.StaticAsyncConciseGeneratorMethod)
		|| isInRange(kind, FunctionKind.ConciseGeneratorMethod, FunctionKind.ClassStaticInitializerFunction);
}

export function isStrictFunctionWithoutPrototype(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.GetterFunction, FunctionKind.AsyncArrowFunction)
		|| isInRange(kind, FunctionKind.AsyncConciseMethod, FunctionKind.StaticAsyncConciseGeneratorMethod)
		|| isInRange(kind, FunctionKind.ConciseGeneratorMethod, FunctionKind.ClassStaticInitializerFunction);
}

export function isGetterFunction(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.GetterFunction, FunctionKind.StaticGetterFunction);
}

export function isSetterFunction(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.SetterFunction, FunctionKind.StaticSetterFunction);
}

export function isAccessorFunction(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.GetterFunction, FunctionKind.StaticSetterFunction);
}

export function isDefaultConstructor(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.DefaultBaseConstructor, FunctionKind.DefaultDerivedConstructor);
}

export function isBaseConstructor(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.BaseConstructor, FunctionKind.DefaultBaseConstructor);
}

export function isDerivedConstructor(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.DefaultDerivedConstructor, FunctionKind.DerivedConstructor);
}

export function isClassConstructor(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.BaseConstructor, FunctionKind.DerivedConstructor);
}

export function isClassMembersInitializerFunction(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.ClassMembersInitializerFunction, FunctionKind.ClassStaticInitializerFunction);
}

export function isConstructable(kind: FunctionKind) {
	return isInRange(kind, FunctionKind.NormalFunction, FunctionKind.DerivedConstructor);
}

export function isStatic(kind: FunctionKind) {
	switch (kind) {
		case FunctionKind.StaticGetterFunction:
		case FunctionKind.StaticSetterFunction:
		case FunctionKind.StaticConciseMethod:
		case FunctionKind.StaticConciseGeneratorMethod:
		case FunctionKind.StaticAsyncConciseMethod:
		case FunctionKind.StaticAsyncConciseGeneratorMethod:
		case FunctionKind.ClassStaticInitializerFunction:
			return true;
		default:
			return false;
	}
}

export function bindsSuper(kind: FunctionKind) {
	return isConciseMethod(kind) || isAccessorFunction(kind) || isClassConstructor(kind);
}

export function isAwaitAsIdentifierDisallowed(kind: FunctionKind) {
	// 'await' is always disallowed as an identifier in module contexts. Callers
	// should short-circuit the module case instead of calling this.
	return !isModule(kind) && (isAsyncFunction(kind) || kind == FunctionKind.ClassStaticInitializerFunction);
}

export function functionKind2String(kind: FunctionKind): string {
	return FunctionKind[kind];
}

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

export enum ObjectLiteralPropertyKind {
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

export enum ClassLiteralPropertyKind {
	METHOD = 'METHOD',
	GETTER = 'GETTER',
	SETTER = 'SETTER',
	FIELD = 'FIELD'
}

export class ClassLiteralProperty {
	static Kind = ClassLiteralPropertyKind;
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

export enum VariableDeclarationContext {
	StatementListItem,
	Statement,
	ForStatement
};

export enum AllowLabelledFunctionStatement {
	AllowLabelledFunctionStatement,
	DisallowLabelledFunctionStatement,
};
