import type { ExpressionDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer()
export class LiteralObjectNode extends AbstractExpressionNode {

    static fromJSON(node: LiteralObjectNode, deserializer: ExpressionDeserializer): LiteralObjectNode {
        return new LiteralObjectNode(node.keyValue.map(expression => deserializer(expression as any)));
    }

    constructor(private keyValue: { key: string, value: ExpressionNode }[]) {
        super();
    }

    set(stack: ScopedStack) {
        throw new Error("LiteralArrayNode#set() has no implementation.");
    }

    get(stack: ScopedStack) {
        return this.keyValue
            .map(item => { return { key: item.key, value: item.value.get(stack) }; })
            .reduce((prev, current) => {
                prev[current.key] = current.value;
                return prev;
            }, Object.create(null));
    }

    entry(): string[] {
        return [];
    }

    event(parent?: string): string[] {
        return [];
    }

    toString() {
        return `{ ${this.keyValue.map(item => `${item.key}: ${item.value.toString()}`).join(', ')} }`;
    }

    toJson(): object {
        return {
            items: this.keyValue.map(item => { return { key: item.key, value: item.value.toJSON() }; })
        };
    }

}
