import type { ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { RestParameter } from './rest-parameter.js';
import { PropertyNode, ValueNode } from './values.js';

@Deserializer()
export class FunctionDefinitionNode extends AbstractExpressionNode {

    static KEYWORDS = ['function', '=>'];

    static fromJSON(node: FunctionDefinitionNode): FunctionDefinitionNode {
        return new FunctionDefinitionNode(
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

    set(context: object, value: Function) {
        if (this.funcName) {
            Reflect.set(context, this.funcName.get(), value);
        }
    }

    get(context: object) {
        this.paramNames.forEach(param => param.set(context, param.get(context)));
        return this.funcBody
            .map(line => line.get(context))
            .find((value, index, array) => index === array.length - 1);
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
