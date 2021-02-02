import type { ScopedStack } from './scope.js';

export type NodeJsonType = { type: string, node: { [key: string]: any } };

export interface ExpressionNode {
    set(stack: ScopedStack, value: any): any;
    get(stack: ScopedStack): any;
    getThis?(stack: ScopedStack): any;
    entry(): string[];
    event(parent?: string): string[];
    toString(): string;
    toJSON(key?: string): NodeJsonType;
    getClass(): NodeExpressionClass<ExpressionNode>;
}

interface TypeOf<T> {
    new(...params: any[]): T;
}

export type ExpressionDeserializer = (node: NodeJsonType) => ExpressionNode;

/**
 * this is how to:
 * describe a class with it's static functions and properties
 */
export interface NodeExpressionClass<T extends ExpressionNode> extends TypeOf<T> {
    KEYWORDS?: string[];
    fromJSON(node: T, deserializer: ExpressionDeserializer): T;
}

