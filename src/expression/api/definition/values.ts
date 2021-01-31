import { Deserializer } from '../deserialize/deserialize.js';
import type { ExpressionNode, NodeExpressionClass, NodeJsonType } from '../expression.js';

@Deserializer()
export class PropertyNode implements ExpressionNode {

    static fromJSON(node: PropertyNode): PropertyNode {
        return new PropertyNode(node.property);
    }

    constructor(private property: string | number) { }

    getClass(): NodeExpressionClass<PropertyNode> {
        return PropertyNode;
    }

    set(context: object, value: any) {
        Reflect.set(context, this.property, value);
        return value;
    }

    get(context: { [key: string]: any }) {
        return context[this.property];
    }

    entry(): string[] {
        return [this.toString()];
    }

    event(): string[] {
        return [this.toString()];
    }

    toString(): string {
        return String(this.property);
    }

    toJSON(): NodeJsonType {
        return {
            type: PropertyNode.name,
            node: { property: this.property }
        };
    }
}

@Deserializer()
export class ValueNode implements ExpressionNode {

    static fromJSON(node: ValueNode): ValueNode {
        return new ValueNode(node.value);
    }

    private quote: string;

    constructor(private value: string | number) {
        if (typeof value === 'string') {
            this.quote = value.substring(0, 1);
            value = `"${value.substring(1, value.length - 1)}"`;
        }
        this.value = JSON.parse(value as string);
    }

    getClass(): NodeExpressionClass<ValueNode> {
        return ValueNode;
    }

    set() {
        throw new Error("ValueNode#set() has no implementation.");
    }

    get() {
        return this.value;
    }

    entry(): string[] {
        return [];
    }

    event(): string[] {
        return [];
    }

    toString(): string {
        if (typeof this.value === 'string') {
            return `${this.quote}${this.value}${this.quote}`;
        }
        return String(this.value);
    }

    toJSON(): NodeJsonType {
        let node: { value: string | number };
        if (typeof this.value === 'string') {
            node = { value: `${this.quote}${this.value}${this.quote}` };
        } else {
            node = { value: this.value };
        }
        return { type: ValueNode.name, node };
    }
}

export const TRUE = String(true);
export const FALSE = String(false);
export const NULL = String(null);
export const UNDEFINED = String(undefined);


@Deserializer()
export class NativeValueNode implements ExpressionNode {

    static fromJSON(node: NativeValueNode): NativeValueNode {
        switch (String(node.value)) {
            case TRUE: return TrueNode as NativeValueNode;
            case FALSE: return FalseNode as NativeValueNode;
            case NULL: return NullNode as NativeValueNode;
            case UNDEFINED:
            default: return UndefinedNode as NativeValueNode;
        }
    }

    constructor(private value: true | false | null | undefined | bigint) {
        this.value = this.value;
    }

    getClass(): NodeExpressionClass<NativeValueNode> {
        return NativeValueNode;
    }

    set() {
        throw new Error("BooleanNode.set() Method has not implementation.");
    }

    get() {
        return this.value;
    }

    entry(): string[] {
        return [];
    }

    event(parent?: string): string[] {
        return []
    }

    toString(): string {
        return String(this.value);
    }

    toJSON(): NodeJsonType {
        return {
            type: NativeValueNode.name,
            node: { value: this.toString() }
        };
    }
}

export const NullNode = Object.freeze(new NativeValueNode(null));
export const UndefinedNode = Object.freeze(new NativeValueNode(undefined));
export const TrueNode = Object.freeze(new NativeValueNode(true));
export const FalseNode = Object.freeze(new NativeValueNode(false));
export const ThisNode = Object.freeze(new PropertyNode('this'));
