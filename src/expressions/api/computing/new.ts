import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { StackProvider } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { SpreadNode } from './spread.js';
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
	set(stack: StackProvider, value: any) {
		throw new Error(`NewNode#set() has no implementation.`);
	}
	get(stack: StackProvider,) {
		const classRef = this.className.get(stack);
		let value: any;
		if (this.parameters) {
			if (this.parameters.length > 0) {
				const parameters: any[] = [];
				const parametersStack = stack.emptyStackProviderWith(parameters);
				for (const param of this.parameters) {
					if (param instanceof SpreadNode) {
						param.get(parametersStack);
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
