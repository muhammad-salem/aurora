import { Scope } from '../../scope/scope.js';
import { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Identifier, Literal } from '../definition/values.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ExpressionEventPath, ExpressionNode, NodeDeserializer, VisitNodeType } from '../expression.js';

export abstract class ModuleSpecifier extends AbstractExpressionNode {
	constructor(protected local: Identifier) {
		super();
	}
	getLocal() {
		return this.local;
	}
	toJson(): object {
		return {
			local: this.local.toJSON()
		};
	}
}



@Deserializer('ImportAttribute')
export class ImportAttribute extends AbstractExpressionNode {
	static fromJSON(node: ImportAttribute, deserializer: NodeDeserializer): ImportAttribute {
		return new ImportAttribute(
			deserializer(node.key) as Identifier,
			deserializer(node.value) as Literal<string>
		);
	}
	static visit(node: ImportAttribute, visitNode: VisitNodeType): void {
		visitNode(node.key);
		visitNode(node.value);
	}

	constructor(private key: Identifier | Literal<string>, private value: Literal<string>) {
		super();
	}
	getKey() {
		return this.key;
	}
	getValue() {
		return this.value;
	}
	shareVariables(scopeList: Scope<any>[]): void {
		throw new Error('Method not implemented.');
	}
	set(stack: Stack, value: any) {
		throw new Error('Method not implemented.');
	}
	get(stack: Stack, thisContext?: any): { [key: string]: string } {
		const key = this.key.get(stack);
		const value = this.value.get();
		return { [key]: value };
	}
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	toString(): string {
		return `${this.key.toString()}: ${this.value.toString()}`;
	}
	toJson(): object {
		return {
			key: this.key.toJSON(),
			value: this.value.toJSON(),
		};
	}
}
