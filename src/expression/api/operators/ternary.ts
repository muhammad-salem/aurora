import type { ExpDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';


export class TernaryNode extends AbstractExpressionNode {

    static fromJSON(node: TernaryNode, serializer: ExpDeserializer): TernaryNode {
        return new TernaryNode(
            serializer(node.logical as any),
            serializer(node.ifTrue as any),
            serializer(node.ifFalse as any)
        );
    }

    constructor(private logical: ExpressionNode, private ifTrue: ExpressionNode, private ifFalse: ExpressionNode) {
        super();
    }
    set(context: object, value: any) {
        throw new Error(`TernaryNode#set() has no implementation.`);
    }
    get(context: object) {
        return this.logical.get(context) ? this.ifFalse.get(context) : this.ifTrue.get(context);
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
