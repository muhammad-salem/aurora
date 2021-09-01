import type { Scope, ScopeType } from '../scope/scope.js';
import type { Stack } from '../scope/stack.js';

export type NodeType = { type: string };
export type NodeJsonType = { [key: string]: any } & NodeType;

export interface ExpressionNode {
	set(stack: Stack, value: any): any;
	get(stack: Stack, thisContext?: any): any;
	entry(): string[];
	event(parent?: string): string[];
	toString(): string;
	toJSON(key?: string): NodeJsonType;
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
	fromJSON(node: T, deserializer: NodeDeserializer): T;
}

export interface CanDeclareVariable {
	/**
	 * declare variable in the current local scope (block),
	 * or closest function scope (global) scop,
	 * the propertyName will be calculated at runtime
	 * @param stack the stack which an identifier will be declared
	 * @param propertyValue the initial value of identifer
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
	 * try to search for scope of this expression, is meant to be used 
	 * @param stack 
	 */
	findScope<T extends object>(stack: Stack): Scope<T>;
	findScope<T extends object>(stack: Stack, scope: Scope<any>): Scope<T>;
	findScope<T extends object>(stack: Stack, scope?: Scope<any>): Scope<T> | undefined;
}