import type { StackProvider } from './scope.js';

export type NodeType = { type: string };
export type NodeJsonType = { [key: string]: any } & NodeType;

export interface ExpressionNode {
	set(stack: StackProvider, value: any): any;
	get(stack: StackProvider, thisContext?: any): any;
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
