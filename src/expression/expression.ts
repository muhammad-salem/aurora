
export interface NodeExpression {
    set(context: object, value: any): any;
    get(context: object): any;
    entry(): string[];
    toString(): string;
}

export class ValueNode implements NodeExpression {
    constructor(public value: string | number | boolean) {
        if (typeof value === 'string' && value.startsWith(`'`) && value.endsWith(`'`)) {
            value = `"${value.substring(1, value.length - 1)}"`
        }
        this.value = JSON.parse(value as string);
    }
    set(context: object, value: any) {
        throw new Error("ValueNode#set() has no implementation.");
    }
    get(context: object) {
        return this.value;
    }
    entry(): string[] {
        return [];
    }
    toString(): string {
        if (typeof this.value === 'string') {
            return `"${this.value}"`;
        }
        return String(this.value);
    }
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
    toString(): string {
        return this.property;
    }
}
