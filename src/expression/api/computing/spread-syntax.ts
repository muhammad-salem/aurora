import { Deserializer } from '../deserialize/deserialize.js';
import type { ExpressionNode, NodeExpressionClass, NodeJsonType } from '../expression.js';

@Deserializer()
export class SpreadSyntax implements ExpressionNode {

    static KEYWORDS = ['...'];

    static fromJSON(nodeExp: SpreadSyntax): SpreadSyntax {
        return new SpreadSyntax(nodeExp.node);
    }

    constructor(private node: ExpressionNode) { }

    set(context: object, value: any) {
        throw new Error('SpreadSyntax.set() Method has no implementation.');
    }

    get(context: object): any[] | { [k: string]: any } {
        const object = this.node.get(context);
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

    toJSON(key?: string): NodeJsonType {
        return {
            type: SpreadSyntax.name,
            node: { node: this.node.toJSON() }
        };
    }

    getClass(): NodeExpressionClass<SpreadSyntax> {
        return SpreadSyntax;
    }

}
