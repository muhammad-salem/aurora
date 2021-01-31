import { Deserializer } from '../deserialize/deserialize.js';
import type { ExpressionNode, NodeExpressionClass, NodeJsonType } from '../expression.js';
import { SpreadSyntax } from './spread-syntax.js';

@Deserializer()
export class FunctionExecNode implements ExpressionNode {

    static fromJSON(node: FunctionExecNode): FunctionExecNode {
        return new FunctionExecNode(node.func, node.params);
    }

    constructor(private func: ExpressionNode, private params: ExpressionNode[]) { }

    getClass(): NodeExpressionClass<FunctionExecNode> {
        return FunctionExecNode;
    }

    set(context: object, value: any) {
        throw new Error(`FunctionExecNode#set() has no implementation.`);
    }

    get(context: object) {
        const funCallBack = this.func.get(context) as Function;
        const argArray: any[] = [];
        this.params.forEach(param => {
            if (param instanceof SpreadSyntax) {
                const spreadObj = param.get(context);
                if (Array.isArray(spreadObj)) {
                    spreadObj.forEach(arg => argArray.push(arg));
                } else {
                    /** wrong use her, it shouldn't do that */
                    // args.push(spreadObj);
                    throw new Error('a function support only spread array syntax');
                }
            } else {
                argArray.push(param.get(context));
            }
        });
        const value = funCallBack.call(context, ...argArray);
        return value;
    }

    entry(): string[] {
        return [...this.func.entry(), ...this.params.flatMap(param => param.entry())];
    }

    event(parent?: string): string[] {
        return [];
    }

    toString(): string {
        return `${this.func.toString()}(${this.params.map(param => param.toString()).join(', ')})`;
    }

    toJSON(): NodeJsonType {
        return {
            type: FunctionExecNode.name,
            node: {
                func: this.func,
                params: this.params.map(param => param.toJSON())
            }
        };
    }
}
