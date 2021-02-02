import type { ExpDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer()
export class StatementNode extends AbstractExpressionNode {

    static KEYWORDS = [';'];

    static fromJSON(node: StatementNode, deserializer: ExpDeserializer): StatementNode {
        const nodes = node.lines.map(line => deserializer(line as any));
        return new StatementNode(node.lines);
    }

    constructor(private lines: ExpressionNode[]) {
        super();
    }

    set(context: object, value: any) {
        throw new Error(`StatementNode#set() has no implementation.`);
    }

    get(context: object) {
        let value;
        this.lines.forEach(node => value = node.get(context));
        return value;
    }

    entry(): string[] {
        return this.lines.flatMap(node => node.entry());
    }

    event(parent?: string): string[] {
        return this.lines.flatMap(node => node.event(parent));
    }

    toString(): string {
        return this.lines.map(node => node.toString()).join('; ');
    }

    toJson(): object {
        return { lines: this.lines.map(line => line.toJSON()) };
    }

}