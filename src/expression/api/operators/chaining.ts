import type { ExpressionDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer()
export class OptionalChainingNode extends AbstractExpressionNode {

    static fromJSON(node: OptionalChainingNode, deserializer: ExpressionDeserializer): OptionalChainingNode {
        return new OptionalChainingNode(deserializer(node.optional as any), deserializer(node.property as any));
    }

    constructor(private optional: ExpressionNode, private property: ExpressionNode) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        const object = this.optional.get(stack);
        if (object === null || object === undefined) {
            return undefined
        }
        return this.property.set(object, value);
    }

    get(stack: ScopedStack) {
        const object = this.optional.get(stack);
        if (object === null || object === undefined) {
            return undefined
        }
        return this.property.get(object);
    }

    getThis(stack: ScopedStack): any {
        return this.optional.get(stack);
    }

    entry(): string[] {
        return [...this.optional.entry(), ...this.property.entry()];
    }

    event(parent?: string): string[] {
        return [];
    }

    toString() {
        return `${this.optional.toString()}?.${this.property.toString()}`;
    }

    toJson(): object {
        return {
            optional: this.optional.toJSON(),
            property: this.property.toJSON()
        };
    }

}
