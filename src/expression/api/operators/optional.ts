import type { ExpDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer()
export class OptionalChainingNode extends AbstractExpressionNode {

    static fromJSON(node: OptionalChainingNode, serializer: ExpDeserializer): OptionalChainingNode {
        return new OptionalChainingNode(serializer(node.optional as any), serializer(node.property as any));
    }

    constructor(private optional: ExpressionNode, private property: ExpressionNode) {
        super();
    }

    set(context: object, value: any) {
        const object = this.optional.get(context);
        if (object === null || object === undefined) {
            return undefined
        }
        return this.property.set(object, value);
    }

    get(context: object) {
        const object = this.optional.get(context);
        if (object === null || object === undefined) {
            return undefined
        }
        return this.property.get(object);
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
