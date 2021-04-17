import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer('property')
export class ObjectLiteralPropertyNode extends AbstractExpressionNode {
	static fromJSON(node: ObjectLiteralPropertyNode, deserializer: NodeDeserializer): ObjectLiteralPropertyNode {
		return new ObjectLiteralPropertyNode(deserializer(node.name), deserializer(node.value));
	}
	constructor(protected name: ExpressionNode, protected value: ExpressionNode) {
		super();
	}
	getName() {
		return this.name;
	}
	getValue() {
		return this.value;
	}
	set(stack: ScopedStack, value: any) {
		return stack.set(this.name.get(stack), value);
	}
	get(stack: ScopedStack, thisContext?: object): any {
		return this.value.get(stack, thisContext);
	}
	entry(): string[] {
		return [];
	}
	event(): string[] {
		return [];
	}
	toString(): string {
		return `${this.name.toString()}: ${this.value.toString()}`;
	}
	toJson(): object {
		return {
			// type: this.type,
			name: this.name.toJSON(),
			value: this.value.toJSON()
		};
	}
}

@Deserializer('set')
export class SetPropertyNode extends ObjectLiteralPropertyNode {
	static fromJSON(node: SetPropertyNode, deserializer: NodeDeserializer): SetPropertyNode {
		return new SetPropertyNode(deserializer(node.name), deserializer(node.value));
	}
	set(stack: ScopedStack, value: any) {
		return true;
	}
	get(stack: ScopedStack, thisContext: ThisType<any>): void {
		const set: (v: any) => void = this.value.get(stack, thisContext);
		Object.defineProperty(thisContext, this.name.get(stack), { set });
	}
}

@Deserializer('get')
export class GetPropertyNode extends ObjectLiteralPropertyNode {
	static fromJSON(node: GetPropertyNode, deserializer: NodeDeserializer): GetPropertyNode {
		return new GetPropertyNode(deserializer(node.name), deserializer(node.value));
	}
	set(stack: ScopedStack, value: any) {
		return true;
	}
	get(stack: ScopedStack, thisContext: ThisType<any>): void {
		const get: () => any = this.value.get(stack, thisContext);
		Object.defineProperty(thisContext, this.name.get(stack), { get });
	}
}

@Deserializer('object')
export class ObjectLiteralNode extends AbstractExpressionNode {
	static fromJSON(node: ObjectLiteralNode, deserializer: NodeDeserializer): ObjectLiteralNode {
		return new ObjectLiteralNode(node.properties.map(deserializer));
	}
	constructor(private properties: ExpressionNode[]) {
		super();
	}
	getProperties() {
		return this.properties;
	}
	set(stack: ScopedStack) {
		throw new Error('LiteralObjectNode#set() has no implementation.');
	}
	get(stack: ScopedStack) {
		const newObject = Object.create(null);
		const objectScope = stack.emptyScopeFor(newObject);
		this.properties.forEach(prop => prop.set(objectScope, prop.get(stack, newObject)));
		return newObject;
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString() {
		return `{ ${this.properties.map(item => item.toString()).join(', ')} }`;
	}
	toJson(): object {
		return {
			properties: this.properties.map(item => item.toJSON())
		};
	}
}
