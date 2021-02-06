import type { NodeDeserializer, ExpressionNode, NodeExpressionClass, NodeJsonType } from '../expression.js';
import type { OperatorPosition } from './types.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';
@Deserializer('increment')
export class IncrementDecrementNode implements ExpressionNode {

    static Evaluations: { [key: string]: (value: number) => number } = {
        '++': (value: number) => { return ++value; },
        '--': (value: number) => { return --value; }
    };

    static KEYWORDS = Object.keys(IncrementDecrementNode.Evaluations);

    static fromJSON(node: IncrementDecrementNode, deserializer: NodeDeserializer): IncrementDecrementNode {
        return new IncrementDecrementNode(node.op, deserializer(node.node), node.position);
    }

    constructor(private op: '++' | '--', private node: ExpressionNode, private position: OperatorPosition) { }

    getClass(): NodeExpressionClass<IncrementDecrementNode> {
        return IncrementDecrementNode;
    }

    set(stack: ScopedStack, value: any) {
        this.node.set(stack, value);
    }

    get(stack: ScopedStack) {
        let value = this.node.get(stack);
        let opValue = IncrementDecrementNode.Evaluations[this.op](value);
        this.set(stack, opValue);
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
