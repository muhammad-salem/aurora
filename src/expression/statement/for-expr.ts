import { NodeExpression, PropertyNode } from '../expression.js';

export class DeclareVariableOperator implements NodeExpression {

    static Operators: string[] = ['var', 'let', 'const'];

    constructor(public op: string, public propertyName: PropertyNode) { }

    set(context: object, value: any) {
        Reflect.set(context, this.propertyName.get(context), value);
    }
    get(context: object) {
        return Reflect.get(context, this.propertyName.get(context));
    }
    entry(): string[] {
        return [];
    }
    toString(): string {
        return `${this.op} ${this.propertyName.toString()}`;
    }
}

export class AliasedOperator implements NodeExpression {

    static Operator: string = 'as';

    constructor(public localProperty: PropertyNode, public aliasedProperty: PropertyNode) { }

    set(context: object, value: any) {
        // Object.defineProperty(context, this.aliasedProperty.toString(), { value });
        Reflect.set(context, this.aliasedProperty.get(context), value);
    }
    get(context: object) {
        return Reflect.get(context, this.aliasedProperty.get(context));
    }
    entry(): string[] {
        return this.aliasedProperty.entry();
    }
    toString(): string {
        return `${this.localProperty.toString()} ${AliasedOperator.Operator} ${this.aliasedProperty.toString()}`;
    }
}

export class OfItemsOperator implements NodeExpression {

    static Operator: string = 'of';

    constructor(public items: PropertyNode) { }

    set(context: object, value: any) {
        Reflect.set(context, this.items.get(context), value);
    }
    get(context: object) {
        return Reflect.get(context, this.items.get(context));
    }
    entry(): string[] {
        return this.items.entry();
    }
    toString(): string {
        return `${OfItemsOperator.Operator} ${this.items.toString()}`;
    }
}
