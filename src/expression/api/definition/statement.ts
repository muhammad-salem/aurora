import { Deserializer } from '../deserialize/deserialize.js';
import type { ExpDeserializer, ExpressionNode, NodeExpressionClass, NodeJsonType } from '../expression.js';

@Deserializer()
export class StatementNode implements ExpressionNode {

    static KEYWORDS = [';'];

    static fromJSON(node: StatementNode, deserializer: ExpDeserializer): StatementNode {
        const nodes = node.nodes.map(line => deserializer(line as any));
        return new StatementNode(node.nodes);
    }

    constructor(private nodes: ExpressionNode[]) { }

    getClass(): NodeExpressionClass<StatementNode> {
        return StatementNode;
    }

    set(context: object, value: any) {
        throw new Error(`StatementNode#set() has no implementation.`);
    }

    get(context: object) {
        let value;
        this.nodes.forEach(node => value = node.get(context));
        return value;
    }

    entry(): string[] {
        return this.nodes.flatMap(node => node.entry());
    }

    event(parent?: string): string[] {
        return this.nodes.flatMap(node => node.event(parent));
    }

    toString(): string {
        return this.nodes.map(node => node.toString()).join('; ');
    }

    toJSON(): NodeJsonType {
        return {
            type: StatementNode.name,
            node: { nodes: this.nodes.map(node => node.toJSON()) }
        };
    }

}