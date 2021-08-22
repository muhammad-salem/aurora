import type { NodeDeserializer, ExpressionNode } from '../expression';
import { AbstractExpressionNode } from '../abstract';
import { Deserializer } from '../deserialize/deserialize';
import { StackProvider } from '../scope';

@Deserializer('ExpressionStatement')
export class StatementNode extends AbstractExpressionNode {
	static fromJSON(node: StatementNode, deserializer: NodeDeserializer): StatementNode {
		return new StatementNode(node.body.map(line => deserializer(line)));
	}
	constructor(private body: ExpressionNode[]) {
		super();
	}
	getBody() {
		return this.body;
	}
	set(stack: StackProvider, value: any) {
		throw new Error(`StatementNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		let value;
		this.body.forEach(node => value = node.get(stack));
		return value;
	}
	entry(): string[] {
		return this.body.flatMap(node => node.entry());
	}
	event(parent?: string): string[] {
		return this.body.flatMap(node => node.event(parent));
	}
	toString(): string {
		return this.body.map(node => node.toString()).join('; ').concat(';');
	}
	toJson(): object {
		return { body: this.body.map(exp => exp.toJSON()) };
	}
}
