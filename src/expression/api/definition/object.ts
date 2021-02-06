import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer('object')
export class LiteralObjectNode extends AbstractExpressionNode {

    static fromJSON(node: LiteralObjectNode, deserializer: NodeDeserializer): LiteralObjectNode {
        return new LiteralObjectNode(node.keyValue.map(exp => { return { key: exp.key, value: deserializer(exp.value) } }));
    }

    constructor(private keyValue: { key: string, value: ExpressionNode }[]) {
        super();
    }

    set(stack: ScopedStack) {
        throw new Error('LiteralObjectNode#set() has no implementation.');
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
            keyValue: this.keyValue.map(item => { return { key: item.key, value: item.value.toJSON() }; })
        };
    }

}
