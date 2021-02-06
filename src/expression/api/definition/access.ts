import type { ScopedStack } from '../scope.js';
import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';

@Deserializer('access')
export class PropertyAccessNode extends AbstractExpressionNode {

    static KEYWORDS = [
        /**
         * dot notation
         */
        '.',
        /**
         * bracket notation
         */
        '[]'
    ];

    static fromJSON(node: PropertyAccessNode, deserializer: NodeDeserializer): PropertyAccessNode {
        return new PropertyAccessNode(node.op, deserializer(node.left), deserializer(node.right));
    }

    constructor(private op: string, private left: ExpressionNode, private right: ExpressionNode) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        return this.right.set(stack.stackFor(this.left.get(stack)), value);
    }

    get(stack: ScopedStack) {
        if (this.op === '.') {
            return this.right.get(stack.stackFor(this.left.get(stack)));
        } else {
            return this.left.get(stack)[this.right.get(stack)];
        }
    }

    getThis(stack: ScopedStack): any {
        return this.left.get(stack);
    }

    entry(): string[] {
        return this.left.entry();
    }

    event(parent?: string): string[] {
        parent ||= '';
        if (this.op === '.') {
            parent += this.left.toString() + '.';
            return this.right.event(parent);
        } else {
            return [`${parent}${this.left.event(parent)}[${this.right.event()}]`];
        }
    }

    toString() {
        if (this.op === '.') {
            return `${this.left.toString()}.${this.right.toString()}`;
        } else {
            return `${this.left.toString()}[${this.right.toString()}]`;
        }
    }

    toJson(): object {
        return {
            op: this.op,
            left: this.left.toJSON(),
            right: this.right.toJSON()
        };
    }

}
