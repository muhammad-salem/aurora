import type { ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer('spread')
export class SpreadSyntaxNode extends AbstractExpressionNode {

    static KEYWORDS = ['...'];

    static fromJSON(nodeExp: SpreadSyntaxNode): SpreadSyntaxNode {
        return new SpreadSyntaxNode(nodeExp.node);
    }

    constructor(private node: ExpressionNode) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        throw new Error('SpreadSyntax.set() Method has no implementation.');
    }

    get(stack: ScopedStack): any[] | { [k: string]: any } {
        const object = this.node.get(stack);
        if (Array.isArray(object)) {
            return this.getArray(object);
        } else if (Reflect.has(object, Symbol.iterator)) {
            return this.getIterator(object);
        } else {
            return this.getObject(object);
        }
    }

    getArray(contextArray: any[]): any[] {
        const result: any[] = [];
        contextArray.forEach(item => result.push(item));
        return result;
    }

    getIterator(iterator: Iterator<any>): any[] {
        const result: any[] = [];
        while (true) {
            const iteratorResult = iterator.next();
            if (iteratorResult.done) {
                break;
            }
            result.push(iteratorResult.value);
        }
        return result;
    }

    getObject(contextObject: any): { [k in keyof typeof contextObject]: any } {
        const result: { [k in keyof typeof contextObject]: any } = {};
        Object.keys(contextObject).forEach(key => result[key] = contextObject[key]);
        return result;
    }

    entry(): string[] {
        return [];
    }

    event(parent?: string): string[] {
        return [];
    }

    toString(): string {
        return `...${this.node.toString()}`;
    }

    toJson(): object {
        return { node: this.node.toJSON() };
    }

}
