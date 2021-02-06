import type { ExpressionNode } from '../expression.js';
import type { ScopedStack } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { RestParameter } from './rest-parameter.js';
import { PropertyNode, ValueNode } from './values.js';
import { ReturnValue } from '../computing/return.js';

@Deserializer()
export class FunctionDeclarationNode extends AbstractExpressionNode {

    static KEYWORDS = ['function', '=>'];

    static fromJSON(node: FunctionDeclarationNode): FunctionDeclarationNode {
        return new FunctionDeclarationNode(
            node.funcBody,
            node.paramNames,
            node.restParamter,
            node.isArrow,
            node.funcName
        );
    }

    constructor(
        private funcBody: ExpressionNode[],
        private paramNames: PropertyNode[],
        private restParamter?: RestParameter,
        private isArrow: boolean = false,
        private funcName?: ValueNode
    ) {
        super();
    }

    set(stack: ScopedStack, value: Function) {
        throw new Error('FunctionDeclarationNode#set() has no implementation.');
    }

    get(stack: ScopedStack) {
        const func = (...args: any[]) => {
            const funcStack = stack.newStack();
            this.paramNames.forEach((param, index) => funcStack.set(param.get(stack), args[index]));
            let returnValue;
            for (const node of this.funcBody) {
                returnValue = node.get(funcStack);
                if (returnValue instanceof ReturnValue) {
                    return returnValue.value;
                }
            }
        };
        if (this.funcName) {
            stack.set(this.funcName.get(), func);
        }
        return func;
    }

    entry(): string[] {
        return [
            ...this.paramNames.flatMap(param => param.entry()),
            /** remove for now, should return only object not defined in this function scope */
            // ...this.funcBody.flatMap(line => line.entry())
        ];
    }

    event(): string[] {
        return this.funcBody.flatMap(node => node.event());
    }

    toString(): string {
        if (this.isArrow) {
            return `(${this.paramNames.map(param => param.toString()).join(', ')}${this.restParamter ? ', ' + this.restParamter.toString() : ''})  => {
                ${this.funcBody.map(line => line.toString())}
            }`;
        } else {
            return `${this.funcName!.toString()}(${this.paramNames.map(param => param.toString()).join(', ')}${this.restParamter ? ', ' + this.restParamter.toString() : ''}) {
                ${this.funcBody.map(line => line.toString())}
            }`;
        }

    }

    toJson(): object {
        return { value: this.toString() };
    }

}
