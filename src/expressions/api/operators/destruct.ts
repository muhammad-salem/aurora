import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { StackProvider } from '../scope.js';

@Deserializer('destruct')
export class DestructuringAssignmentNode extends AbstractExpressionNode {
	static fromJSON(node: DestructuringAssignmentNode, deserializer: NodeDeserializer): DestructuringAssignmentNode {
		return new DestructuringAssignmentNode(
			node.keys.map(key => deserializer(key)),
			deserializer(node.arrayOrObject),
			node.restKey ? deserializer(node.restKey) : void 0
		);
	}
	constructor(private keys: ExpressionNode[], private arrayOrObject: ExpressionNode, private restKey?: ExpressionNode) {
		super();
	}
	getKeys() {
		return this.keys;
	}
	getArrayOrObject() {
		return this.arrayOrObject;
	}
	getRestKey() {
		return this.restKey;
	}
	set(stack: StackProvider) {
		const value = this.arrayOrObject.get(stack);
		if (Array.isArray(value)) {
			let lastIndex = -1;
			this.keys.forEach((key, index) => {
				lastIndex = index;
				key.set(stack, value[index]);
			});
			this.restKey?.set(stack, value.slice(++lastIndex));
		} else if (Symbol.iterator in value) {
			const iterator: Iterator<any> = value[Symbol.iterator]();
			this.keys.forEach((key, index) => {
				key.set(stack, iterator.next().value);
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
				this.restKey.set(stack, restValues);
			}

		} else if (typeof value === 'object') {
			const destructedKeys: string[] = [];
			this.keys.forEach(key => {
				const propName = key.get(stack);
				key.set(stack, value[propName]);
				destructedKeys.push(propName);
			});
			if (this.restKey) {
				this.restKey?.set(stack, Object.keys(value)
					.filter(propName => !destructedKeys.includes(propName))
					.reduce((obj, propName) => {
						obj[propName] = value[propName];
						return obj;
					}, {} as { [key: string]: any }));
			}
		}
		return value;
	}
	get(stack: StackProvider) {
		return this.set(stack);
	}
	entry(): string[] {
		return [...this.keys.flatMap(key => key.entry()), ...(this.restKey?.entry() || [])];
	}
	event(parent?: string): string[] {
		return [...this.keys.flatMap(key => key.event()), ...(this.restKey?.event() || [])];
	}
	toString() {
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
