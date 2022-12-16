import type {
	ExpressionEventPath, ExpressionNode, NodeDeserializer,
	SourceLocation, VisitNodeType
} from '../expression.js';
import { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Identifier, Literal } from '../definition/values.js';
import { Deserializer } from '../deserialize/deserialize.js';

export abstract class ModuleSpecifier extends AbstractExpressionNode {
	constructor(protected local: Identifier, loc?: SourceLocation) {
		super(loc);
	}
	getLocal() {
		return this.local;
	}
	getLocalName() {
		return this.local.getName();
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
			deserializer(node.value) as Literal<string>,
			node.loc
		);
	}
	static visit(node: ImportAttribute, visitNode: VisitNodeType): void {
		visitNode(node.key);
		visitNode(node.value);
	}

	constructor(private key: Identifier | Literal<string>, private value: Literal<string>, loc?: SourceLocation) {
		super(loc);
	}
	getKey() {
		return this.key;
	}
	getValue() {
		return this.value;
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
