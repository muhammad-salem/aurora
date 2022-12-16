import type { Scope, Context } from '../scope/scope.js';
import type { Stack } from '../scope/stack.js';
import { TypeOf } from './utils.js';


/**
 * Each Position object consists of 
 * a line number (1-indexed) 
 * and a column number (0-indexed)
 * and a offset number (0-indexed)
 */
export interface Position {
	line: number; // >= 1
	column: number; // >= 0
	offset: number; //  >= 0
}

export interface SourceLocation {
	source: string | null;
	start: Position;
	end: Position;
}

export type NodeType = { type: string };
export type NodeJsonType = { [key: string]: any } & NodeType;

export type ExpressionEventPathDotNotation = { computed: false, path: string };
export type ExpressionEventPathBracketNotation = { computed: true, path: string, computedPath: ExpressionEventPath[][] };
export type ExpressionEventPath = ExpressionEventPathDotNotation | ExpressionEventPathBracketNotation;
export type ExpressionEventMap = { [key: string]: ExpressionEventMap };

export interface ExpressionNode {

	/**
	 * The `type` field is a string representing the AST variant type.
	 * Each subtype of `Node` is documented below with the specific string of its type field.
	 * You can use this field to determine which interface a node implements.
	 */
	type: string;

	/**
	 * The `loc` field represents the source location information of the node.
	 * If the node contains no information about the source location,
	 * the field is `null` or `undefined`;
	 * otherwise it is an object consisting of 
	 * a start position (the position of the first character of the parsed source region)
	 * and an end position (the position of the first character after the parsed source region):
	 * and offset index (the position of the first character) 
	 */
	loc?: SourceLocation;

	/**
	 * assign the value to this expression in stack.
	 * 
	 * most ExpressionNode will not implement this method, and will throw an exception.
	 * @param stack 
	 * @param value 
	 */
	set(stack: Stack, value: any): any;

	/**
	 * execute/get the code for this expression and return the result value.
	 * @param stack 
	 * @param thisContext 
	 */
	get(stack: Stack, thisContext?: any): any;

	/**
	 * get all dependencies form an expression node
	 *
	 * the return from this method, is represent an answer for what identifiers this expression depends-on.
	 * 
	 *
	 * ex:
	 * ```js
	 * x + y;
	 * ```
	 *
	 * - for `+` operator :	the answer should be `lhs` and `rhs`,
	 * - for `x` identifier:	the answer should be node `x`,
	 * - for `y` identifier:	the answer should be node `y`.
	 *
	 * so, the return from `+` will be `[ node 'x', node 'y']`
	 *
	 * and:
	 * - `x.y.z * a` ==> `[ member node `x.y.z`, identifier 'a']`
	 * @param computed
	 */
	dependency(computed?: true): ExpressionNode[];

	/**
	 * ex:
	 * ```js
	 * x + y;
	 * ```
	 *
	 * - for `+` operator :	the answer should be `lhs` and `rhs`,
	 * - for `x` identifier:	the answer should be node `x`,
	 * - for `y` identifier:	the answer should be node `y`.
	 *
	 * so, the return from `+` will be `['x', 'y']`
	 *
	 * and:
	 * - `x.y.z` ==> `['x', 'y', 'z']`
	 * - `x[y].z` ==> ['x', ]
	 * @param computed required for member and chaining operators
	 */
	dependencyPath(computed?: true): ExpressionEventPath[];

	/**
	 * get all the events form this expression
	 * 
	 * the return from this method, is represent an answer for what is this expression depends-on as identifier name
	 * 
	 * ex: 
	 * ```js
	 * x + y;
	 * ```
	 * 
	 * - for `+` operator :	the answer should be `lhs` and `rhs`,
	 * - for `x` identifier: the answer should be `x`
	 * - for `y` identifier: the answer should be `y`
	 * the final output will be 
	 * 
	 * so, the return from `+` will be `{ x: undefined, y: undefined }`
	 * 
	 * and:
	 * - `x.y.z * a` ==> `{ x: { y: { z: undefined }, a: undefined } }`
	 * - `x.y.z > x.y.h.g` ==> `{ x: { y: { z: undefined, h: { g: undefined} } } }`
	 * - `x[Symbol.toStringTag] + 'Class' + classType + array[3]` ==> `{ x: { 'Symbol.toStringTag': undefined }, classType: undefined,  array: { 3: undefined }  }`
	 * - `'name'` ==> {}
	 * - ```js
	 * user[firstName + `son of ${fatherName}`]
	 * ``` ==> `{ user: { 'firstName:fatherName': undefined }, firstName: undefined, fatherName: undefined }`
	 * @param parent 
	 */
	events(): ExpressionEventMap;


	/**
	 * re-write this expression as a javascript source 
	 */
	toString(): string;

	/**
	 * used to map this object to represent an [ESTree](https://github.com/estree/estree) json object
	 * @param key 
	 */
	toJSON(): NodeJsonType;

	/**
	 * just a helper method to force class that implement this interface to
	 * have a static method `fromJSON` to help reconstruct this ExpressionNode
	 * from an [ESTree](https://github.com/estree/estree) json object,
	 * with all necessary implementation to execute the code
	 */
	getClass(): ExpressionNodConstructor<ExpressionNode>;
}

export type NodeDeserializer<N = ExpressionNode> = (node: N) => N;

export type VisitNodeType = (expression: ExpressionNode) => void;

/**
 * this is how to:
 * describe a class with it's static functions and properties
 * in the interface add getClass method
 */
export interface ExpressionNodConstructor<N extends ExpressionNode> extends TypeOf<N> {

	/**
	 * the type of an expression
	 */
	type: string;

	/**
	 * build expression node from [ESTree](https://github.com/estree/estree) json object
	 * @param node 
	 * @param deserializer 
	 */
	fromJSON(node: N, deserializer: NodeDeserializer): N;

	/**
	 * visit nodes inside expression
	 * @param expression 
	 * @param callback 
	 */
	visit?(node: N, visitNode: Object): void;
}

export interface DeclarationExpression extends ExpressionNode {
	/**
	 * declare variable in the current local scope (block),
	 * or closest function scope (global) scop,
	 * the propertyName will be calculated at runtime
	 * @param stack the stack which an identifier will be declared
	 * @param propertyValue the initial value of identifier
	 * @param scope which scop to declare this identifier
	 */
	declareVariable(stack: Stack, propertyValue?: any): any;

	/**
	 * get the variable declaration name
	 */
	getDeclarationName?(): string;
}


/**
 * An interface meant to be implemented by MemberExpression,
 * Identifier and ChainExpression and all Literal expressions
 */
export interface CanFindScope {
	/**
	 * try to search for scope of this expression
	 * @param stack 
	 */
	findScope<V extends Context>(stack: Stack): Scope<V>;
	findScope<V extends Context>(stack: Stack, scope: Scope<Record<PropertyKey, V>>): Scope<V>;
	findScope<V extends Context>(stack: Stack, scope?: Scope<Record<PropertyKey, V>>): Scope<V> | undefined;
}
