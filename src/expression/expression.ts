
export interface NodeExpression {
    set(context: object, value: any): any;
    get(context: object): any;
    entry(): string[];
    event(parent?: string): string[];
    toString(): string;
}

export class PropertyNode implements NodeExpression {
    constructor(public property: string) { }
    set(context: object, value: any) {
        Reflect.set(context, this.property, value);
        return value;
    }
    get(context: { [key: string]: any }) {
        return context[this.property];
    }
    entry(): string[] {
        return [this.property];
    }
    event(): string[] {
        return [this.toString()];
    }
    toString(): string {
        return this.property;
    }
}

export class ValueNode implements NodeExpression {
    #value: string | number;
    constructor(value: string | number) {
        this.#value = value;
    }
    set() {
        throw new Error("ValueNode#set() has no implementation.");
    }
    get() {
        return this.#value;
    }
    entry(): string[] {
        return [];
    }
    event(): string[] {
        return [];
    }
    toString(): string {
        return String(this.#value);
    }
}

export type NativeValueNodeType = true | false | null | undefined;
export class NativeValueNode implements NodeExpression {
    #value: NativeValueNodeType;
    constructor(value: NativeValueNodeType) {
        this.#value = this.#value;
    }
    set() {
        throw new Error("BooleanNode.set() Method has not implementation.");
    }
    get() {
        return this.#value;
    }
    entry(): string[] {
        return [];
    }
    event(parent?: string): string[] {
        return []
    }
    toString(): string {
        return String(this.#value);
    }
}

export const NullNode = Object.freeze(new NativeValueNode(null));
export const UndefinedNode = Object.freeze(new NativeValueNode(undefined));

export const TrueNode = Object.freeze(new NativeValueNode(true));
export const FalseNode = Object.freeze(new NativeValueNode(false));
