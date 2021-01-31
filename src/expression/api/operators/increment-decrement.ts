import { Deserializer } from '../deserialize/deserialize.js';
import type { ExpDeserializer, ExpressionNode, NodeExpressionClass, NodeJsonType } from '../expression.js';
import type { OperatorPosition } from './types.js';

@Deserializer()
export class IncrementDecrementNode implements ExpressionNode {

    static Evaluations: { [key: string]: (value: number) => number } = {
        '++': (value: number) => { return ++value; },
        '--': (value: number) => { return --value; }
    };

    static KEYWORDS = Object.keys(IncrementDecrementNode.Evaluations);

    static fromJSON(node: IncrementDecrementNode, serializer: ExpDeserializer): IncrementDecrementNode {
        return new IncrementDecrementNode(node.op, serializer(node.node as any), node.position);
    }

    constructor(private op: '++' | '--', private node: ExpressionNode, private position: OperatorPosition) { }

    getClass(): NodeExpressionClass<IncrementDecrementNode> {
        return IncrementDecrementNode;
    }

    set(context: object, value: any) {
        this.node.set(context, value);
    }

    get(context: object) {
        let value = this.node.get(context);
        let opValue = IncrementDecrementNode.Evaluations[this.op](value);
        this.set(context, opValue);
        if (this.position === 'PREFIX') {
            value = opValue;
        }
        return value;
    }

    entry(): string[] {
        return this.node.entry();
    }

    event(parent?: string): string[] {
        return this.node.event(parent);
    }

    toString() {
        if (this.position === 'POSTFIX') {
            return `${this.node.toString()}${this.op}`;
        } else {
            return `${this.op}${this.node.toString()}`;
        }
    }

    toJSON(): NodeJsonType {
        return {
            type: IncrementDecrementNode.name,
            node: {
                op: this.op,
                node: this.node.toJSON(),
                position: this.position
            }
        }
    }

}
