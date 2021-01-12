import { NodeExpression, PropertyNode } from '../expression.js';

export class DeclareVariableOperator implements NodeExpression {

    static Operators: string[] = ['var', 'let', 'const'];

    static parser(tokens: (NodeExpression | string)[]): void {
        DeclareVariableOperator.Operators.forEach(op => {
            for (let i = 1; (i = tokens.indexOf(op, i - 1)) > -1;) {
                const propertyName = tokens[i + 1];
                if (typeof propertyName === 'object') {
                    tokens.splice(i, 2, new DeclareVariableOperator(op, propertyName));
                }
            }
        });
    }

    constructor(public op: string, public propertyName: NodeExpression) { }

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

    static Operators: string[] = ['as'];

    static parser(tokens: (NodeExpression | string)[]): void {
        AliasedOperator.Operators.forEach(op => {
            for (let i = 1; (i = tokens.indexOf(op, i - 1)) > -1;) {
                let pre = tokens[i - 1], post = tokens[i + 1];
                if (typeof pre === 'object' && typeof post === 'object') {
                    tokens.splice(i - 1, 3, new AliasedOperator(pre, post));
                }
            }
        });
    }

    constructor(public localProperty: NodeExpression, public aliasedProperty: NodeExpression) { }

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
        return `${this.localProperty.toString()} ${AliasedOperator.Operators[0]} ${this.aliasedProperty.toString()}`;
    }
}

export class OfItemsOperator implements NodeExpression {

    static Operators: string[] = ['of'];

    static parser(tokens: (NodeExpression | string)[]): void {
        OfItemsOperator.Operators.forEach(op => {
            for (let i = 1; (i = tokens.indexOf(op, i - 1)) > -1;) {
                const propertyName = tokens[i + 1];
                if (typeof propertyName === 'object') {
                    tokens.splice(i, 2, new OfItemsOperator(propertyName));
                }
            }
        });
    }

    constructor(public items: NodeExpression) { }

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
        return `${OfItemsOperator.Operators[0]} ${this.items.toString()}`;
    }
}
