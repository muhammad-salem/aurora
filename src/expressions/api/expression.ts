import type { Scope, ScopeType } from '../scope/scope.js';
import type { Stack } from '../scope/stack.js';

export type NodeType = { type: string };
export type NodeJsonType = { [key: string]: any } & NodeType;

export type DependencyVariables = PropertyKey | Array<PropertyKey | PropertyKey[] | DependencyVariables>;

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
	shareVariables(scopeList: Scope<any>[]): void;

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
	 * - for `x` identifier:	the answer should be `x`
	 * - for `y` identifier:	the answer should be `y`
	 * 
	 * so, the return from `+` will be `['x', 'y']`
	 * 
	 * and:
	 * - `x.y.z * a` ==> `[ ['x', 'y', 'z'], 'a']`
	 * - `x[Symbol.toStringTag] + 'Class' + classType + array[3]` ==> `[ [ 'x', Symbol.toStringTag ], 'classType', ['array'] ]`
	 * - `'name'` ==> []
	 * @param parent 
	 */
	events(): DependencyVariables;

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
	getClass(): NodeExpressionClass<ExpressionNode>;
}

interface TypeOf<T> {
	new(...params: any[]): T;
}

export type NodeDeserializer<T = ExpressionNode> = (node: T) => T;

/**
 * this is how to:
 * describe a class with it's static functions and properties
 * in the interface add getClass method
 */
export interface NodeExpressionClass<T extends ExpressionNode> extends TypeOf<T> {

	/**
	 * build expression node from [ESTree](https://github.com/estree/estree) json object
	 * @param node 
	 * @param deserializer 
	 */
	fromJSON(node: T, deserializer: NodeDeserializer): T;
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
	declareVariable(stack: Stack, scopeType: ScopeType, propertyValue?: any): any;
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
	findScope<T extends object>(stack: Stack): Scope<T>;
	findScope<T extends object>(stack: Stack, scope: Scope<any>): Scope<T>;
	findScope<T extends object>(stack: Stack, scope?: Scope<any>): Scope<T> | undefined;
}
