import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { ScopedStack } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { SpreadSyntaxNode } from './spread.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('new')
export class NewNode extends AbstractExpressionNode {
	static fromJSON(node: NewNode, deserializer: NodeDeserializer): NewNode {
		return new NewNode(deserializer(node.className), node.parameters?.map(deserializer));
	}
	constructor(private className: ExpressionNode, private parameters?: ExpressionNode[]) {
		super();
	}
	getClassName() {
		return this.className;
	}
	getParameters() {
		return this.parameters;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`NewNode#set() has no implementation.`);
	}
	get(stack: ScopedStack,) {
		const classRef = this.className.get(stack);
		let value = new classRef();
		if (this.parameters) {
			const parameters = this.parameters.filter(param => !(param instanceof SpreadSyntaxNode))
				.map(param => param.get(stack));
			const spreadParam = this.parameters[this.parameters.length - 1];
			if (spreadParam instanceof SpreadSyntaxNode) {
				const spreadArray = spreadParam.getNode().get(stack);
				value = new classRef(...parameters, ...spreadArray);
			} else {
				value = new classRef(...parameters);
			}
			value = new classRef(...parameters);
		} else {
			value = new classRef;
		}
		return value;
	}
	entry(): string[] {
		return [...this.className.entry()].concat(this.parameters?.flatMap(param => param.entry()) || []);
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		const parameters = this.parameters ? `(${this.parameters?.map(param => param.toString()).join(', ')})` : '';
		return `new ${this.className.toString()}${parameters}`;
	}
	toJson(): object {
		return {
			className: this.className.toJSON(),
			parameters: this.parameters?.map(param => param.toJSON())
		};
	}
}
