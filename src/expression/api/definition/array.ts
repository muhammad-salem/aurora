import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer('array')
export class LiteralArrayNode extends AbstractExpressionNode {

    static fromJSON(node: LiteralArrayNode, deserializer: NodeDeserializer): LiteralArrayNode {
        return new LiteralArrayNode(node.items.map(expression => deserializer(expression)));
    }

    constructor(private items: ExpressionNode[]) {
        super();
    }

    set(stack: ScopedStack) {
        throw new Error("LiteralArrayNode#set() has no implementation.");
    }

    get(stack: ScopedStack) {
        return this.items.map(item => item.get(stack));
    }

    entry(): string[] {
        return [];
    }

    event(parent?: string): string[] {
        return [];
    }

    toString() {
        return this.items.map(item => item.toString()).toString();
    }

    toJson(): object {
        return {
            items: this.items.map(item => item.toJSON())
        };
    }

}
