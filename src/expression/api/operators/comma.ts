import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';
import { RestParameterNode } from '../definition/rest.js';

@Deserializer('comma')
export class CommaNode extends AbstractExpressionNode {

    static fromJSON(node: CommaNode, deserializer: NodeDeserializer): CommaNode {
        return new CommaNode(node.expressions.map(expression => deserializer(expression as any)));
    }

    constructor(private expressions: ExpressionNode[]) {
        super();
    }

    set(stack: ScopedStack, values: any[]) {
        for (let index = 0; index < this.expressions.length; index++) {
            const expr = this.expressions[index];
            if (expr instanceof RestParameterNode) {
                expr.set(stack, this.expressions.slice(index).map(node => node.get(stack)));
                return;
            }
            stack.set(expr.get(stack), values[index]);
        }
    }

    get(stack: ScopedStack) {
        return this.expressions.map(expr => expr.get(stack));
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
