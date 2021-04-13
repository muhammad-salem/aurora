import type { ExpressionNode, NodeDeserializer } from '../expression.js';
import type { ScopedStack } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { IdentifierNode } from './values.js';

export enum FunctionType {
	NORMAL = 'NORMAL',
	GENERATOR = 'GENERATOR',
	ASYNC = 'ASYNC',
	ASYNC_GENERATOR = 'ASYNC_GENERATOR'
}
export enum ArrowFunctionType {
	NORMAL = 'NORMAL',
	ASYNC = 'ASYNC'
}

@Deserializer('function')
export class FunctionDeclarationNode extends AbstractExpressionNode {
	static KEYWORDS = ['function'];
	static fromJSON(node: FunctionDeclarationNode, deserializer: NodeDeserializer): FunctionDeclarationNode {
		return new FunctionDeclarationNode(
			deserializer(node.parameters),
			deserializer(node.statements),
			FunctionType[node.type],
			node.name ? deserializer(node.name) as IdentifierNode : void 0
		);
	}
	constructor(
		private parameters: ExpressionNode,
		private statements: ExpressionNode,
		private type: FunctionType,
		private name?: ExpressionNode) {
		super();
	}
	getParameters() {
		return this.parameters;
	}
	getStatements() {
		return this.statements;
	}
	getType() {
		return this.type;
	}
	getName() {
		return this.name;
	}
	set(stack: ScopedStack, value: Function) {
		throw new Error('FunctionDeclarationNode#set() has no implementation.');
	}
	get(stack: ScopedStack) {
		const self = this;
		let func: Function;
		switch (this.type) {
			case FunctionType.ASYNC:
				func = async function (...args: any[]) {
					const funcStack = stack.newStack();
					self.parameters.set(funcStack, args);
					return self.statements.get(funcStack);
				};
				break;
			case FunctionType.GENERATOR:
				func = function* (...args: any[]) {
					const funcStack = stack.newStack();
					self.parameters.set(funcStack, args);
					return self.statements.get(funcStack);
				};
				break;
			case FunctionType.ASYNC_GENERATOR:
				func = async function* (...args: any[]) {
					const funcStack = stack.newStack();
					self.parameters.set(funcStack, args);
					return self.statements.get(funcStack);
				};
				break;
			default:
			case FunctionType.NORMAL:
				func = function (...args: any[]) {
					const funcStack = stack.newStack();
					self.parameters.set(funcStack, args);
					return self.statements.get(funcStack);
				};
				break;
		}
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
		let declare: string;
		switch (this.type) {
			case FunctionType.ASYNC:
				declare = 'async function'; break;
			case FunctionType.GENERATOR:
				declare = 'function*'; break;
			case FunctionType.ASYNC_GENERATOR:
				declare = 'async function*'; break;
			default:
			case FunctionType.NORMAL:
				declare = 'function'; break;
		}
		return `${declare} ${this.name?.toString() || ''}(${this.parameters.toString()}) ${this.statements.toString()}`;
	}
	toJson(): object {
		return {
			parameters: this.parameters.toJSON(),
			statements: this.statements.toJSON(),
			type: this.type,
			name: this.name?.toJSON()
		};
	}
}


@Deserializer('=>')
export class ArrowFunctionNode extends AbstractExpressionNode {
	static KEYWORDS = ['=>'];
	static fromJSON(node: ArrowFunctionNode, deserializer: NodeDeserializer): ArrowFunctionNode {
		return new ArrowFunctionNode(
			deserializer(node.parameters),
			deserializer(node.statements),
			ArrowFunctionType[node.type]
		);
	}
	constructor(private parameters: ExpressionNode, private statements: ExpressionNode, private type: ArrowFunctionType) {
		super();
	}
	getParameters() {
		return this.parameters;
	}
	getStatements() {
		return this.statements;
	}
	set(stack: ScopedStack, value: Function) {
		throw new Error('FunctionDeclarationNode#set() has no implementation.');
	}
	get(stack: ScopedStack) {
		let func: Function;
		switch (this.type) {
			case ArrowFunctionType.ASYNC:
				func = async (...args: any[]) => {
					const funcStack = stack.newStack();
					this.parameters.set(funcStack, args);
					return this.statements.get(funcStack);
				};
				break;
			default:
			case ArrowFunctionType.NORMAL:
				func = (...args: any[]) => {
					const funcStack = stack.newStack();
					this.parameters.set(funcStack, args);
					return this.statements.get(funcStack);
				};
				break;
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
		return `${this.type === ArrowFunctionType.ASYNC ? 'async ' : ''}${this.parameters.toString()} => ${this.statements.toString()}`;
	}
	toJson(): object {
		return {
			parameters: this.parameters.toJSON(),
			statements: this.statements.toJSON(),
			type: this.type,
		};
	}
}
