import type { Scope } from '../scope/scope.js';
import type { AwaitPromiseInfo, Stack } from '../scope/stack.js';
import type {
	NodeDeserializer, ExpressionNode, ExpressionNodConstructor,
	NodeJsonType, DeclarationExpression, ExpressionEventMap,
	ExpressionEventPath, VisitNodeType
} from './expression.js';

function initPathExpressionEventMap(rootEventMap: ExpressionEventMap, path: ExpressionEventPath[]): void {
	let lastMap = rootEventMap;
	// let index = 0;
	for (const node of path) {
		const scopeName = node.path;
		let eventMap = lastMap[scopeName];
		if (eventMap) {
			lastMap = eventMap;
			continue;
		}
		// if ((index++) === path.length - 1) {
		// 	lastMap[scopeName] = undefined;
		// 	continue;
		// }
		lastMap = lastMap[scopeName] = {};
		if (node.computed) {
			node.computedPath.forEach(path => initPathExpressionEventMap(rootEventMap, path));
		}
	}
}
export abstract class AbstractExpressionNode implements ExpressionNode {
	static fromJSON(node: ExpressionNode, deserializer: NodeDeserializer): ExpressionNode {
		return deserializer(node as any);
	}
	getClass(): ExpressionNodConstructor<ExpressionNode> {
		return this.constructor as ExpressionNodConstructor<ExpressionNode>;
	}
	toJSON(key?: string): NodeJsonType {
		const type = this.getClass().type;
		const json = this.toJson(key);
		return { type, ...json };
	}
	events(): ExpressionEventMap {
		const dependencyNodes = this.dependency();
		const eventMap: ExpressionEventMap = {};
		for (const node of dependencyNodes) {
			const dependencyPath = node.dependencyPath();
			initPathExpressionEventMap(eventMap, dependencyPath);
		}
		return eventMap;
	}
	abstract shareVariables(scopeList: Scope<any>[]): void;
	abstract set(stack: Stack, value: any): any;
	abstract get(stack: Stack, thisContext?: any): any;
	abstract dependency(computed?: true): ExpressionNode[];
	abstract dependencyPath(computed?: true): ExpressionEventPath[];
	abstract toString(): string;
	abstract toJson(key?: string): { [key: string]: any };
}
export abstract class InfixExpressionNode<T> extends AbstractExpressionNode {
	static visit(node: InfixExpressionNode<any>, visitNode: VisitNodeType): void {
		visitNode(node.getLeft());
		visitNode(node.getRight())
	}
	constructor(protected operator: T, protected left: ExpressionNode, protected right: ExpressionNode) {
		super();
	}
	getOperator() {
		return this.operator;
	}
	getLeft() {
		return this.left;
	}
	getRight() {
		return this.right;
	}
	shareVariables(scopeList: Scope<any>[]): void {
		this.left.shareVariables(scopeList);
		this.right.shareVariables(scopeList);
	}
	set(context: object, value: any) {
		throw new Error(`${this.constructor.name}#set() of operator: '${this.operator}' has no implementation.`);
	}
	abstract get(stack: Stack): any;
	dependency(computed?: true): ExpressionNode[] {
		return this.left.dependency(computed).concat(this.right.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.left.dependencyPath(computed).concat(this.right.dependencyPath(computed));
	}
	toString() {
		return `${this.left.toString()} ${this.operator} ${this.right.toString()}`;
	}
	toJson(key: string): object {
		return {
			operator: this.operator,
			left: this.left.toJSON(),
			right: this.right.toJSON()
		};
	}
}

export class ReturnValue {
	constructor(public value: any) { }
	getValue() {
		return this.value;
	}
}

export class YieldValue {
	constructor(public value: any) { }
	getValue() {
		return this.value;
	}
}

export class YieldDelegateValue {
	constructor(public value: any) { }
	getValue() {
		return this.value;
	}
}

export class AwaitPromise implements AwaitPromiseInfo {
	node: DeclarationExpression;
	declareVariable: boolean;
	constructor(public promise: Promise<any>) { }
}
