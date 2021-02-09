import type { ScopedStack } from '../scope.js';
import type { ExpressionNode, NodeDeserializer } from '../expression.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';

@Deserializer('new')
export class NewNode extends AbstractExpressionNode {

    static KEYWORDS = ['new '];

    static fromJSON(node: NewNode, deserializer: NodeDeserializer): NewNode {
        return new NewNode(
            deserializer(node.construct),
            node.params && node.params.map(deserializer)
        );
    }

    constructor(private construct: ExpressionNode, private params?: ExpressionNode[]) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        throw new Error('NewNode#set() has no implementation.');
    }

    get(stack: ScopedStack): any {
        const func = this.construct.get(stack);
        if (!this.params) {
            return new func;
        } else if (this.params.length === 0) {
            return new func();
        } else {
            const param = this.params.map(arg => arg.get(stack));
            return new func(...param);
        }
    }

    event(parent?: string): string[] {
        return [];
    }

    entry(): string[] {
        return [];
    }

    toString(): string {
        if (!this.params) {
            return `new ${this.construct.toString()}`;
        } else if (this.params.length === 0) {
            return `new ${this.construct.toString()}()`;
        } else {
            return `new ${this.construct.toString()}(${this.params.map(arg => arg.toString()).join(', ')})`;
        }
    }

    toJson(): object {
        const json: { construct: {}, params?: {} } = {
            construct: this.construct.toJSON(),
        };
        if (this.params) {
            json.params = this.params.map(arg => arg.toJSON());
        }
        return json;
    }

}
