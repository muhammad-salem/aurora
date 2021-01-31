import { Deserializer } from '../deserialize/deserialize.js';
import type { ExpDeserializer, ExpressionNode, NodeExpressionClass, NodeJsonType } from '../expression.js';

@Deserializer()
export class UnaryNode implements ExpressionNode {

    static fromJSON(node: UnaryNode, serializer: ExpDeserializer): UnaryNode {
        return new UnaryNode(node.op, serializer(node.node as any));
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

    constructor(private op: string, private node: ExpressionNode) { }

    getClass(): NodeExpressionClass<UnaryNode> {
        return UnaryNode;
    }

    set(context: object, value: any) {
        return this.node.set(context, value);
    }

    get(context: object) {
        let value = this.node.get(context);
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

    toJSON(): NodeJsonType {
        return {
            type: UnaryNode.name,
            node: {
                op: this.op,
                node: this.node.toJSON()
            }
        };
    }

}


@Deserializer()
export class LiteralUnaryNode implements ExpressionNode {

    static fromJSON(node: LiteralUnaryNode, serializer: ExpDeserializer): LiteralUnaryNode {
        return new LiteralUnaryNode(node.op, serializer(node.node as any));
    }

    static KEYWORDS = ['delete', 'typeof', 'void'];

    constructor(private op: string, private node: ExpressionNode) { }
    getClass(): NodeExpressionClass<LiteralUnaryNode> {
        return LiteralUnaryNode;
    }

    set(context: object, value: any) {
        throw new Error('LiteralUnaryOperators#set() has no implementation.');
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

    get(context: object) {
        switch (this.op) {
            case 'delete': return this.getDelete(context);
            case 'typeof': return this.getTypeof(context);
            case 'void': return this.getVoid(context);
        }
    }

    private getVoid(context: object) {
        return void this.node.get(context);
    }
    private getTypeof(context: object) {
        return typeof this.node.get(context);
    }
    private getDelete(context: object) {
        throw new Error('LiteralUnaryOperators.delete#get() has no implementation yet.');
        // if (this.node instanceof MemberNode || this.node instanceof NavigationNode) {
        //     if (this.node.right instanceof ValueNode) {
        //         let parent = this.node.left.get(context);
        //         return Reflect.deleteProperty(parent, this.node.right.get(context) as string | number);
        //     } else {
        //         // loop to get to an end of the chain
        //     }
        // } else if (this.node instanceof PropertyNode) {
        //     return Reflect.deleteProperty(context, this.node.get(context));
        // }
        // return Reflect.deleteProperty(context, this.node.get(context));
    }

    toString() {
        return `${this.op} ${this.node.toString()}`;
    }

    toJSON(): NodeJsonType {
        return {
            type: UnaryNode.name,
            node: {
                op: this.op,
                node: this.node.toJSON()
            }
        };
    }

}