import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { ScopedStack } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { SpreadSyntaxNode } from './spread.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('new')
export class NewNode extends AbstractExpressionNode {
	static fromJSON(node: NewNode, deserializer: NodeDeserializer): NewNode {
		return new NewNode(deserializer(node.className), node.params?.map(deserializer));
	}
	constructor(private className: ExpressionNode, private params?: ExpressionNode[]) {
		super();
	}
	getClassName() {
		return this.className;
	}
	getParams() {
		return this.params;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`NewNode#set() has no implementation.`);
	}
	get(stack: ScopedStack,) {
		const classRef = this.className.get(stack);
		const argArray: any[] = [];
		this.params?.forEach(param => {
			if (param instanceof SpreadSyntaxNode) {
				const spreadObj = param.get(stack);
				if (Array.isArray(spreadObj)) {
					spreadObj.forEach(arg => argArray.push(arg));
				} else {
					/** wrong use her, it shouldn't do that */
					// args.push(spreadObj);
					throw new Error('a function support only spread array syntax');
				}
			} else {
				argArray.push(param.get(stack));
			}
		});
		let value = new classRef();
		if (this.params) {
			value = new classRef;
		} else {
			value = new classRef(...argArray);
		}
		return value;
	}
	entry(): string[] {
		return [...this.className.entry()].concat(this.params?.flatMap(param => param.entry()) || []);
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		const parameters = this.params ? `(${this.params?.map(param => param.toString()).join(', ')})` : '';
		return `new ${this.className.toString()}${parameters}`;
	}
	toJson(): object {
		return {
			func: this.className.toJSON(),
			params: this.params?.map(param => param.toJSON())
		};
	}
}
