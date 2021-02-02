import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

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
    set(stack: ScopedStack, value: any) {
        return stack.localScop.set(this.arrayName, value) ? value : void 0;
    }

    /**
     * used when define a function
     * @param context execution stack/scope context
     */
    get(stack: ScopedStack) {
        return stack.localScop.get(this.arrayName);
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
