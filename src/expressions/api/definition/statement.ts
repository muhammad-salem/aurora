import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('ExpressionStatement')
export class ExpressionStatement extends AbstractExpressionNode {
	static fromJSON(node: ExpressionStatement, deserializer: NodeDeserializer): ExpressionStatement {
		return new ExpressionStatement(node.body.map(line => deserializer(line)));
	}
	constructor(private body: ExpressionNode[]) {
		super();
	}
	getBody() {
		return this.body;
	}
	set(stack: Stack, value: any) {
		throw new Error(`ExpressionStatement#set() has no implementation.`);
	}
	get(stack: Stack) {
		let value;
		this.body.forEach(node => value = node.get(stack));
		return value;
	}
	events(parent?: string): string[] {
		return this.body.flatMap(node => node.events(parent));
	}
	toString(): string {
		return this.body.map(node => node.toString()).join('; ').concat(';');
	}
	toJson(): object {
		return { body: this.body.map(exp => exp.toJSON()) };
	}
}
