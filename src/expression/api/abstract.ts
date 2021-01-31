import type { ExpDeserializer, ExpressionNode, NodeExpressionClass, NodeJsonType } from './expression.js';
import type { EvaluateNode } from './operators/types.js';

export abstract class AbstractExpressionNode implements ExpressionNode {
    static fromJSON(node: ExpressionNode, serializer: ExpDeserializer): ExpressionNode {
        return serializer(node as any);
    }
    getClass(): NodeExpressionClass<ExpressionNode> {
        return this.constructor as NodeExpressionClass<ExpressionNode>;
    }
    toJSON(key?: string): NodeJsonType {
        return {
            type: this.constructor.name,
            node: this.toJson(key)
        };
    }
    abstract set(context: object, value: any): any;
    abstract get(context: object): any;
    abstract entry(): string[];
    abstract event(parent?: string): string[];
    abstract toString(): string;
    abstract toJson(key?: string): object;
}

export abstract class InfixExpressionNode extends AbstractExpressionNode {

    constructor(protected op: string, protected left: ExpressionNode, protected right: ExpressionNode) {
        super();
    }

    set(context: object, value: any) {
        throw new Error(`${this.constructor.name}#set() of (${this.op}) has no implementation.`);
    }
    get(context: object): boolean {
        const evalNode: EvaluateNode = {
            left: this.left.get(context),
            right: this.right.get(context)
        };
        return this.evalNode(evalNode);
    }

    abstract evalNode(evalNode: EvaluateNode): any;

    entry(): string[] {
        return [...this.left.entry(), ...this.right.entry()];
    }
    event(parent?: string): string[] {
        return [];
    }
    toString() {
        return `${this.left.toString()} ${this.op} ${this.right.toString()}`;
    }
    toJson(key: string): object {
        return {
            op: this.op,
            left: this.left.toJSON(),
            right: this.right.toJSON()
        };
    }
}
