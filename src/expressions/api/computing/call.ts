import type {
	NodeDeserializer, ExpressionNode, ExpressionEventPath,
	VisitNodeType, SourceLocation
} from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { SpreadElement } from './spread.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { MemberExpression } from '../definition/member.js';
import { Identifier } from '../definition/values.js';

@Deserializer('CallExpression')
export class CallExpression extends AbstractExpressionNode {
	static fromJSON(node: CallExpression, deserializer: NodeDeserializer): CallExpression {
		return new CallExpression(
			deserializer(node.callee),
			node.arguments.map(param => deserializer(param)),
			node.optional,
			node.range,
			node.loc
		);
	}
	static visit(node: CallExpression, visitNode: VisitNodeType): void {
		visitNode(node.callee);
		node.arguments.forEach(visitNode);
	}
	private arguments: ExpressionNode[];
	constructor(
		private callee: ExpressionNode,
		params: ExpressionNode[],
		private optional: boolean = false,
		range?: [number, number],
		loc?: SourceLocation) {
		super(range, loc);
		this.arguments = params;
	}
	getCallee() {
		return this.callee;
	}
	getArguments() {
		return this.arguments;
	}
	set(stack: Stack, value: any) {
		throw new Error(`CallExpression#set() has no implementation.`);
	}
	get(stack: Stack, thisContext?: any) {
		const funCallBack: Function = this.callee.get(stack) as Function;
		if (this.optional && (funCallBack === null || funCallBack === undefined)) {
			return;
		}
		const parameters: any[] = this.getCallParameters(stack);
		if (!thisContext && this.callee instanceof MemberExpression) {
			thisContext = this.callee.getObject().get(stack);
			if ((funCallBack === null || funCallBack === undefined) && (this.callee as MemberExpression).getOptional()) {
				return;
			}
		} else if (!thisContext && this.callee instanceof Identifier) {
			thisContext = stack.findScope(this.callee.getName()).getContextProxy?.();
		}
		return funCallBack.apply(thisContext, parameters);
	}
	getCallParameters(stack: Stack): any[] {
		const parameters: any[] = [];
		for (const arg of this.arguments) {
			if (arg instanceof SpreadElement) {
				const paramScope = stack.pushBlockScopeFor(parameters);
				arg.get(stack);
				stack.clearTo(paramScope);
				break;
			} else {
				parameters.push(arg.get(stack));
			}
		}
		return parameters;
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.callee.dependency(computed).concat(this.arguments.flatMap(param => param.dependency(computed)));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.callee.dependencyPath(computed).concat(this.arguments.flatMap(param => param.dependencyPath(computed)));
	}
	toString(): string {
		return `${this.callee.toString()}${this.optional ? '?.' : ''}(${this.arguments.map(arg => arg.toString()).join(', ')})`;
	}
	toJson(): object {
		return {
			callee: this.callee.toJSON(),
			arguments: this.arguments.map(arg => arg.toJSON()),
			optional: this.optional
		};
	}
}
