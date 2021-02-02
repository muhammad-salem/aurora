import type { ExpressionDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { ScopedStack } from '../scope.js';

export class TernaryNode extends AbstractExpressionNode {

    static fromJSON(node: TernaryNode, deserializer: ExpressionDeserializer): TernaryNode {
        return new TernaryNode(
            deserializer(node.logical as any),
            deserializer(node.ifTrue as any),
            deserializer(node.ifFalse as any)
        );
    }

    constructor(private logical: ExpressionNode, private ifTrue: ExpressionNode, private ifFalse: ExpressionNode) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        throw new Error(`TernaryNode#set() has no implementation.`);
    }

    get(stack: ScopedStack) {
        return this.logical.get(stack) ? this.ifFalse.get(stack) : this.ifTrue.get(stack);
    }

    entry(): string[] {
        return [...this.logical.entry(), ...this.ifTrue.entry(), ...this.ifFalse.entry()];
    }

    event(parent?: string): string[] {
        return [];
    }

    toString() {
        return `${this.logical.toString()} (${this.ifTrue.toString()}):(${this.ifFalse.toString()})`;
    }

    toJson(): object {
        return {
            logical: this.logical.toJSON(),
            ifTrue: this.ifTrue.toJSON(),
            ifFalse: this.ifFalse.toJSON()
        };
    }

}
