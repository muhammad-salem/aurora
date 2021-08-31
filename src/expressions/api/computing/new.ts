import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { SpreadElement } from './spread.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('NewExpression')
export class NewExpression extends AbstractExpressionNode {
	static fromJSON(node: NewExpression, deserializer: NodeDeserializer): NewExpression {
		return new NewExpression(deserializer(node.className), node.arguments?.map(deserializer));
	}
	private arguments?: ExpressionNode[];
	constructor(private className: ExpressionNode, parameters?: ExpressionNode[]) {
		super();
		this.arguments = parameters;
	}
	getClassName() {
		return this.className;
	}
	getArguments() {
		return this.arguments;
	}
	set(stack: Stack, value: any) {
		throw new Error(`NewExpression#set() has no implementation.`);
	}
	get(stack: Stack,) {
		const classRef = this.className.get(stack);
		let value: any;
		if (this.arguments) {
			if (this.arguments.length > 0) {
				const parameters: any[] = [];
				for (const param of this.arguments) {
					if (param instanceof SpreadElement) {
						stack.pushBlockScopeFor(parameters);
						param.get(stack);
						stack.popScope();
						break;
					} else {
						parameters.push(param.get(stack));
					}
				}
				value = new classRef(...parameters);
			} else {
				value = new classRef();
			}
		} else {
			value = new classRef;
		}
		return value;
	}
	entry(): string[] {
		return [...this.className.entry()].concat(this.arguments?.flatMap(arg => arg.entry()) || []);
	}
	event(parent?: string): string[] {
		return [...this.className.event()].concat(this.arguments?.flatMap(arg => arg.event()) || []);
	}
	toString(): string {
		const parameters = this.arguments ? `(${this.arguments?.map(arg => arg.toString()).join(', ')})` : '';
		return `new ${this.className.toString()}${parameters}`;
	}
	toJson(): object {
		return {
			className: this.className.toJSON(),
			arguments: this.arguments?.map(arg => arg.toJSON())
		};
	}
}
