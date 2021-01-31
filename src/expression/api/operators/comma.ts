import type { ExpDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer()
export class CommaNode extends AbstractExpressionNode {

    static fromJSON(node: CommaNode, serializer: ExpDeserializer): CommaNode {
        return new CommaNode(node.expressions.map(expression => serializer(expression as any)));
    }

    constructor(private expressions: ExpressionNode[]) {
        super();
    }

    set(context: object) {
        return this.expressions
            .map(expression => expression.get(context))
            .find((value, index, array) => index = array.length - 1);
    }

    get(context: object) {
        return this.set(context);
    }

    entry(): string[] {
        return [...this.expressions.flatMap(expression => expression.entry())];
    }

    event(parent?: string): string[] {
        return [...this.expressions.flatMap(expression => expression.event())];
    }

    toString() {
        const isObject = true;
        return this.expressions.map(key => key.toString()).join(', ');
    }

    toJson(): object {
        return {
            expressions: this.expressions.map(expression => expression.toJSON())
        };
    }

}
