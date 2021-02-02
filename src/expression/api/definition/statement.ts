import type { ExpressionDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer()
export class StatementNode extends AbstractExpressionNode {

    static KEYWORDS = [';'];

    static fromJSON(node: StatementNode, deserializer: ExpressionDeserializer): StatementNode {
        const nodes = node.lines.map(line => deserializer(line as any));
        return new StatementNode(node.lines);
    }

    constructor(private lines: ExpressionNode[]) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        throw new Error(`StatementNode#set() has no implementation.`);
    }

    get(stack: ScopedStack) {
        let value;
        this.lines.forEach(node => value = node.get(stack));
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
