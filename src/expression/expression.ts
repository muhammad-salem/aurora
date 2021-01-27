
export interface NodeExpression {
    set(context: object, value: any): any;
    get(context: object): any;
    entry(): string[];
    event(parent?: string): string[];
    toString(): string;
}

export class ValueNode implements NodeExpression {
    private quota: string;
    constructor(public value: string | number | boolean) {
        if (typeof value === 'string') {
            this.quota = value.substring(0, 1);
            value = `"${value.substring(1, value.length - 1)}"`;
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
    event(parent?: string): string[] {
        return [this.toString()];
    }
    toString(): string {
        if (typeof this.value === 'string') {
            return `${this.quota}${this.value}${this.quota}`;
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
    event(parent?: string): string[] {
        parent ||= '';
        return [parent + this.toString()];
    }
    toString(): string {
        return this.property;
    }
}
