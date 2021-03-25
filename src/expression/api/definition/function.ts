import type { ExpressionNode, NodeDeserializer } from '../expression.js';
import type { ScopedStack } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { PropertyNode } from './values.js';

@Deserializer('function-declaration')
export class FunctionDeclarationNode extends AbstractExpressionNode {

	static KEYWORDS = ['function', '=>'];

	static fromJSON(node: FunctionDeclarationNode, deserializer: NodeDeserializer): FunctionDeclarationNode {
		return new FunctionDeclarationNode(
			deserializer(node.parameters),
			deserializer(node.statements),
			node.isArrow,
			node.name ? deserializer(node.name) as PropertyNode : void 0
		);
	}

	constructor(
		private parameters: ExpressionNode,
		private statements: ExpressionNode,
		private isArrow: boolean = false,
		private name?: ExpressionNode) {
		super();
	}

	set(stack: ScopedStack, value: Function) {
		throw new Error('FunctionDeclarationNode#set() has no implementation.');
	}

	get(stack: ScopedStack) {
		const func = (...args: any[]) => {
			const funcStack = stack.newStack();
			this.parameters.set(funcStack, args);
			return this.statements.get(funcStack);
		};
		if (this.name) {
			this.name.set(stack, func);
		}
		return func;
	}

	entry(): string[] {
		return [
			...this.parameters.entry(),
			/** remove for now, should return only object not defined in this function scope */
			// ...this.funcBody.flatMap(line => line.entry())
		];
	}

	event(): string[] {
		return this.statements.event();
	}

	toString(): string {
		if (this.isArrow) {
			return `${this.parameters.toString()} => {
                ${this.statements.toString()}
            }`;
		} else {
			return `function ${this.name?.toString() || ''}${this.parameters.toString()} {
                ${this.statements.toString()}
            }`;
		}
	}

	toJson(): object {
		const func = {
			parameters: this.parameters.toJSON(),
			statements: this.statements.toJSON(),
			isArrow: this.isArrow,
			name: this.name?.toJSON()
		};
		return func;
	}

}
