import { AbstractExpressionNode } from 'api/abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer()
export class RestParameter extends AbstractExpressionNode {

    static KEYWORDS = ['...'];

    static fromJSON(nodeExp: RestParameter): RestParameter {
        return new RestParameter(nodeExp.arrayName);
    }

    constructor(private arrayName: string) {
        super();
    }

    /**
     * 
     * @param context execution stack/scope context
     * @param value any paramter
     */
    set(context: object, value: any) {
        Reflect.set(context, this.arrayName, value);
    }

    /**
     * is used when define a function
     * @param context execution stack/scope context
     */
    get(context: any[]) {
        return Reflect.get(context, this.arrayName);
    }

    applyParams(context: any, ...params: any[]) {
        this.set(context, params);
    }

    entry(): string[] {
        return [];
    }

    event(parent?: string): string[] {
        return [];
    }

    toString(): string {
        return `...${this.arrayName}`;
    }

    toJson(): object {
        return { arrayName: this.arrayName };
    }

}
