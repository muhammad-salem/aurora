import type { ExpressionDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer()
export class CommaNode extends AbstractExpressionNode {

    static fromJSON(node: CommaNode, deserializer: ExpressionDeserializer): CommaNode {
        return new CommaNode(node.expressions.map(expression => deserializer(expression as any)));
    }

    constructor(private expressions: ExpressionNode[]) {
        super();
    }

    set(stack: ScopedStack) {
        let value;
        this.expressions.forEach(expression => value = expression.get(stack))
        return value;
    }

    get(stack: ScopedStack) {
        return this.set(stack);
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
