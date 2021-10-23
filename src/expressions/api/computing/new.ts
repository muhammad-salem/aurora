import type { NodeDeserializer, ExpressionNode, ExpressionEventPath } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
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
	shareVariables(scopeList: Scope<any>[]): void {
		this.arguments?.forEach(param => param.shareVariables(scopeList));
	}
	set(stack: Stack, value: any) {
		throw new Error(`NewExpression#set() has no implementation.`);
	}
	get(stack: Stack) {
		const classRef = this.className.get(stack);
		let value: any;
		if (this.arguments) {
			if (this.arguments.length > 0) {
				const parameters: any[] = [];
				for (const param of this.arguments) {
					if (param instanceof SpreadElement) {
						const paramScope = stack.pushBlockScopeFor(parameters);
						param.get(stack);
						stack.clearTo(paramScope);
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
	dependency(): ExpressionNode[] {
		return this.className.dependency()
			.concat(this.arguments?.flatMap(parm => parm.dependency()) || []);
	}
	dependencyPath(computed: true): ExpressionEventPath[] {
		return this.className.dependencyPath(computed)
			.concat(this.arguments?.flatMap(param => param.dependencyPath(computed)) || []);
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
