import type { ExpressionNode, NodeDeserializer } from '../expression.js';
import type { ScopedStack } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { IdentifierNode } from './values.js';

export enum FunctionType {
	NORMAL = 'NORMAL',						// 0
	ASYNC = 'ASYNC',						// 1
	GENERATOR = 'GENERATOR',				// 2
	ASYNC_GENERATOR = 'ASYNC_GENERATOR'		// 3
}
export enum ArrowFunctionType {
	NORMAL = 'NORMAL',
	ASYNC = 'ASYNC'
}

@Deserializer('param')
export class ParamterNode extends AbstractExpressionNode {
	static fromJSON(node: ParamterNode, deserializer: NodeDeserializer): ParamterNode {
		return new ParamterNode(
			deserializer(node.identifier),
			node.defaultValue ? deserializer(node.defaultValue) as IdentifierNode : void 0
		);
	}
	constructor(private identifier: ExpressionNode, private defaultValue?: ExpressionNode) {
		super();
	}
	getIdentifier() {
		return this.identifier;
	}
	getDefaultValue() {
		return this.defaultValue;
	}
	set(stack: ScopedStack, value: Function) {
		stack.localScop.set(this.identifier.get(stack), value || this.defaultValue?.get(stack));
	}
	get(stack: ScopedStack) {
		throw new Error('ParamterNode#get() has no implementation.');
	}
	entry(): string[] {
		return [];
	}
	event(): string[] {
		return [];
	}
	toString(): string {
		let init = this.defaultValue ? (' = ' + this.defaultValue.toString()) : '';
		return this.identifier.toString() + init;
	}
	toJson(): object {
		return {
			identifier: this.identifier.toJSON(),
			defaultValue: this.defaultValue?.toJSON()
		};
	}
}

@Deserializer('function')
export class FunctionDeclarationNode extends AbstractExpressionNode {
	static KEYWORDS = ['function'];
	static fromJSON(node: FunctionDeclarationNode, deserializer: NodeDeserializer): FunctionDeclarationNode {
		return new FunctionDeclarationNode(
			node.parameters.map(deserializer),
			deserializer(node.statements),
			FunctionType[node.type],
			node.name ? deserializer(node.name) as IdentifierNode : void 0
		);
	}
	constructor(
		private parameters: ExpressionNode[],
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
	private setParamter(stack: ScopedStack, args: any[]) {
		for (let i = 0; i < this.parameters.length; i++) {
			this.parameters[i].set(stack, args[i])
		}
	}
	get(stack: ScopedStack) {
		const self = this;
		let func: Function;
		switch (this.type) {
			case FunctionType.ASYNC:
				func = async function (...args: any[]) {
					const funcStack = stack.newStack();
					self.setParamter(funcStack, args);
					return self.statements.get(funcStack);
				};
				break;
			case FunctionType.GENERATOR:
				func = function* (...args: any[]) {
					const funcStack = stack.newStack();
					self.setParamter(funcStack, args);
					return self.statements.get(funcStack);
				};
				break;
			case FunctionType.ASYNC_GENERATOR:
				func = async function* (...args: any[]) {
					const funcStack = stack.newStack();
					self.setParamter(funcStack, args);
					return self.statements.get(funcStack);
				};
				break;
			default:
			case FunctionType.NORMAL:
				func = function (...args: any[]) {
					const funcStack = stack.newStack();
					self.setParamter(funcStack, args);
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
			...this.parameters.flatMap(param => param.entry()),
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
		return `${declare} ${this.name?.toString() || ''}(${this.parameters.map(param => param.toString()).join(', ')}) ${this.statements.toString()}`;
	}
	toJson(): object {
		return {
			parameters: this.parameters.map(param => param.toJSON()),
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
			node.parameters.map(deserializer),
			deserializer(node.statements),
			ArrowFunctionType[node.type]
		);
	}
	constructor(private parameters: ExpressionNode[], private statements: ExpressionNode, private type: ArrowFunctionType) {
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
	private setParamter(stack: ScopedStack, args: any[]) {
		for (let i = 0; i < this.parameters.length; i++) {
			this.parameters[i].set(stack, args[i])
		}
	}
	get(stack: ScopedStack) {
		let func: Function;
		switch (this.type) {
			case ArrowFunctionType.ASYNC:
				func = async (...args: any[]) => {
					const funcStack = stack.newStack();
					this.setParamter(funcStack, args);
					return this.statements.get(funcStack);
				};
				break;
			default:
			case ArrowFunctionType.NORMAL:
				func = (...args: any[]) => {
					const funcStack = stack.newStack();
					this.setParamter(funcStack, args);
					return this.statements.get(funcStack);
				};
				break;
		}
		return func;
	}
	entry(): string[] {
		return [
			...this.parameters.flatMap(param => param.entry()),
			/** remove for now, should return only object not defined in this function scope */
			// ...this.funcBody.flatMap(line => line.entry())
		];
	}
	event(): string[] {
		return this.statements.event();
	}
	toString(): string {
		let str = this.type === ArrowFunctionType.ASYNC ? 'async ' : '';
		if (this.parameters.length === 0) {
			str += '()';
		} else if (this.parameters.length === 1) {
			str += this.parameters[0].toString();
		} else {
			str += '(';
			str += this.parameters.map(param => param.toString()).join(', ');
			str += ')';
		}
		str += ' => ';
		str += this.statements.toString();
		return str;
	}
	toJson(): object {
		return {
			parameters: this.parameters.map(param => param.toJSON()),
			statements: this.statements.toJSON(),
			type: this.type,
		};
	}
}
