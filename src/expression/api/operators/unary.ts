import type { ExpressionDeserializer, ExpressionNode, NodeExpressionClass, NodeJsonType } from '../expression.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';
import { ScopedStack } from '../scope.js';
@Deserializer()
export class UnaryNode extends AbstractExpressionNode {

    static fromJSON(node: UnaryNode, deserializer: ExpressionDeserializer): UnaryNode {
        return new UnaryNode(node.op, deserializer(node.node as any));
    }

    static Evaluations: { [key: string]: (value: any) => any } = {
        '+': (value: string) => { return +value; },
        '-': (value: number) => { return -value; },
        '~': (value: number) => { return ~value; },
        '!': (value: any) => { return !value; },
        // // 'void': (value: any) => { return void value; },
        // // 'typeof': (value: any) => { return typeof value; },
        // // 'delete': (value: any) => { return delete value; },
    };

    static KEYWORDS = Object.keys(UnaryNode.Evaluations);

    constructor(private op: string, private node: ExpressionNode) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        return this.node.set(stack, value);
    }

    get(stack: ScopedStack) {
        let value = this.node.get(stack);
        return UnaryNode.Evaluations[this.op](value);
    }

    entry(): string[] {
        return this.node.entry();
    }

    event(parent?: string): string[] {
        return [];
    }

    toString() {
        return `${this.op}${this.node.toString()}`;
    }

    toJson(): object {
        return {
            op: this.op,
            node: this.node.toJSON()
        };
    }

}


@Deserializer()
export class LiteralUnaryNode extends AbstractExpressionNode {

    static fromJSON(node: LiteralUnaryNode, serializer: ExpressionDeserializer): LiteralUnaryNode {
        return new LiteralUnaryNode(node.op, serializer(node.node as any));
    }

    static KEYWORDS = ['delete', 'typeof', 'void'];

    constructor(private op: string, private node: ExpressionNode) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        throw new Error('LiteralUnaryNode#set() has no implementation.');
    }

    entry(): string[] {
        return this.node.entry();
    }

    event(parent?: string): string[] {
        if (this.op === 'delete') {
            return this.node.event(parent);
        }
        return [];
    }

    get(stack: ScopedStack) {
        switch (this.op) {
            case 'delete': return this.getDelete(stack);
            case 'typeof': return this.getTypeof(stack);
            case 'void': return this.getVoid(stack);
        }
    }

    private getVoid(stack: ScopedStack) {
        return void this.node.get(stack);
    }
    private getTypeof(stack: ScopedStack) {
        return typeof this.node.get(stack);
    }
    private getDelete(stack: ScopedStack) {
        const thisNode = this.node.getThis?.(stack);
        if (thisNode) {
            delete thisNode[this.node.toString()];
        }
    }

    toString() {
        return `${this.op} ${this.node.toString()}`;
    }

    toJson(): object {
        return {
            op: this.op,
            node: this.node.toJSON()
        };
    }

}
