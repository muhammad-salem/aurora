import type { ExpDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer()
export class DestructuringAssignmentNode extends AbstractExpressionNode {

    static fromJSON(node: DestructuringAssignmentNode, serializer: ExpDeserializer): DestructuringAssignmentNode {

        return new DestructuringAssignmentNode(
            node.keys.map(key => serializer(key as any)),
            serializer(node.arrayOrObject as any),
            node.restKey ? serializer(node.restKey as any) : void 0
        );
    }

    constructor(private keys: ExpressionNode[], private arrayOrObject: ExpressionNode, private restKey?: ExpressionNode) {
        super();
    }

    set(context: object) {
        const value = this.arrayOrObject.get(context);
        if (Array.isArray(value)) {
            let lastIndex = -1;
            this.keys.forEach((key, index) => {
                lastIndex = index;
                key.set(context, value[index]);
            });
            this.restKey?.set(context, value.slice(++lastIndex));
        } else if (Symbol.iterator in value) {
            const iterator: Iterator<any> = value[Symbol.iterator]();
            this.keys.forEach((key, index) => {
                key.set(context, iterator.next().value);
            });
            if (this.restKey) {
                const restValues: any[] = [];
                let result: IteratorResult<any, any>;
                while (true) {
                    result = iterator.next();
                    if (result.done) {
                        break;
                    }
                    restValues.push(result.value);
                }
                this.restKey.set(context, restValues);
            }

        } else if (typeof value === 'object') {
            const destructedKeys: string[] = [];
            this.keys.forEach(key => {
                const propName = key.get(context);
                key.set(context, value[propName]);
                destructedKeys.push(propName);
            });
            if (this.restKey) {
                this.restKey?.set(context, Object.keys(value)
                    .filter(propName => !destructedKeys.includes(propName))
                    .reduce((obj, propName) => {
                        obj[propName] = value[propName];
                        return obj;
                    }, {} as { [key: string]: any }));
            }
        }
        return value;
    }

    get(context: object) {
        return this.set(context);
    }

    entry(): string[] {
        return [...this.keys.flatMap(key => key.entry()), ...(this.restKey?.entry() || [])];
    }

    event(parent?: string): string[] {
        return [...this.keys.flatMap(key => key.event()), ...(this.restKey?.event() || [])];
    }

    toString() {
        const isObject = true;
        return `{${this.keys.map(key => key.toString()).join(', ')}${this.restKey ? ', ...' : ''}${this.restKey?.toString()}} = ${this.arrayOrObject.toString()}`;
    }

    toJson(): object {
        return {
            keys: this.keys.map(key => key.toJSON()),
            arrayOrObject: this.arrayOrObject.toJSON(),
            restKey: this.restKey?.toJSON()
        };
    }

}
