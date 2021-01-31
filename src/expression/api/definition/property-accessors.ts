import { Deserializer } from '../deserialize/deserialize.js';
import { ExpressionNode, NodeExpressionClass, NodeJsonType } from '../expression.js';

@Deserializer()
export class PropertyAccessors implements ExpressionNode {

    static KEYWORDS = [
        /**
         * dot notation
         */
        '.',
        /**
         * bracket notation
         */
        '[]'
    ];

    static fromJSON(node: PropertyAccessors): PropertyAccessors {
        return new PropertyAccessors(node.op, node.left, node.right);
    }

    constructor(private op: string, private left: ExpressionNode, private right: ExpressionNode) { }

    getClass(): NodeExpressionClass<PropertyAccessors> {
        return PropertyAccessors;
    }

    set(context: object, value: any) {
        if (this.op === '.') {
            return this.right.set(this.left.get(context), value);
        } else {
            return this.left.get(context)[this.right.get(context)] = value;
        }
    }

    get(context: object) {
        if (this.op === '.') {
            return this.right.get(this.left.get(context));
        } else {
            return this.left.get(context)[this.right.get(context)];
        }
    }

    entry(): string[] {
        return this.left.entry();
    }

    event(parent?: string): string[] {
        parent ||= '';
        if (this.op === '.') {
            parent += this.left.toString() + '.';
            return this.right.event(parent);
        } else {
            return [`${parent}${this.left.event(parent)}[${this.right.event()}]`];
        }
    }

    toString() {
        if (this.op === '.') {
            return `${this.left.toString()}.${this.right.toString()}`;
        } else {
            return `${this.left.toString()}[${this.right.toString()}]`;
        }
    }

    toJSON(): NodeJsonType {
        return {
            type: PropertyAccessors.name,
            node: {
                op: this.op,
                left: this.left.toJSON(),
                right: this.right.toJSON()
            }
        };
    }

}
