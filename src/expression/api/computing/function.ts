import type { ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { SpreadSyntax } from './spread-syntax.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer()
export class FunctionExecNode extends AbstractExpressionNode {

    static fromJSON(node: FunctionExecNode): FunctionExecNode {
        return new FunctionExecNode(node.func, node.params);
    }

    constructor(private func: ExpressionNode, private params: ExpressionNode[]) {
        super();
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

    toJson(): object {
        return {
            func: this.func.toJSON(),
            params: this.params.map(param => param.toJSON())
        };
    }

}
