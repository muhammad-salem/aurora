import type { Scope, ScopeContext } from '../scope/scope.js';
import type { Stack } from '../scope/stack.js';
import { TypeOf } from './utils.js';

export type NodeType = { type: string };
export type NodeJsonType = { [key: string]: any } & NodeType;

export type ExpressionEventPathDotNotation = { computed: false, path: string };
export type ExpressionEventPathBracketNotation = { computed: true, path: string, computedPath: ExpressionEventPath[][] };
export type ExpressionEventPath = ExpressionEventPathDotNotation | ExpressionEventPathBracketNotation;
export type ExpressionEventMap = { [key: string]: ExpressionEventMap };

export interface ExpressionNode {

	/**
	 * pass scope list from outer function to inner function,
	 * 
	 * all other end point expression should do nothing,
	 *  if this function executed.
	 * 
	 * @param scopeList all outer function scopes given to the inner function,
	 * this solution ignore the fact that some inner function has no need to
	 * get shared variables, as its implementation never say that
	 * ```js
	 * function f(d) {
	 * 		function g() {
	 * 			const a = ({ d }) => d;
	 * 			return a;
	 * 		}
	 * 		return [d, g];
	 * }
	 * ```
	 */
	shareVariables(scopeList: Scope<ScopeContext>[]): void;

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
	 * tha return from this method, is represent an answer for what identifiers this expression depends-on.
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
	 * tha return from this method, is represent an answer for what is this expression depends-on as identifier name
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

export interface CanDeclareExpression extends ExpressionNode {
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
	findScope<T extends ScopeContext>(stack: Stack): Scope<T>;
	findScope<T extends ScopeContext>(stack: Stack, scope: Scope<ScopeContext>): Scope<T>;
	findScope<T extends ScopeContext>(stack: Stack, scope?: Scope<ScopeContext>): Scope<T> | undefined;
}
