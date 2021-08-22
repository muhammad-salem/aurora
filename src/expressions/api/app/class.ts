import { AbstractExpressionNode } from '../abstract';
import { Deserializer } from '../deserialize/deserialize';
import type { ExpressionNode, NodeDeserializer } from '../expression';
import type { StackProvider } from '../scope';


@Deserializer('class')
export class ClassNode extends AbstractExpressionNode {
	static fromJSON(node: ClassNode, deserializer: NodeDeserializer): ClassNode {
		return new ClassNode(
			node.body.map(deserializer),
			node.className ? deserializer(node.className) : void 0,
			node.extendsClass ? deserializer(node.extendsClass) : void 0
		);
	}
	constructor(
		private body: ExpressionNode[],
		private className?: ExpressionNode,
		private extendsClass?: ExpressionNode) {
		super();
	}

	set(stack: StackProvider) {
		throw new Error(`ClassNode.#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		throw new Error(`ClassNode.#get() has no implementation.`);
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString() {
		let classDeclaration = '';
		if (this.className) {
			classDeclaration += this.className.toString();
		}
		if (this.extendsClass) {
			if (this.className) {
				classDeclaration += ' ';
			}
			classDeclaration += 'extends ' + this.extendsClass.toString();
		}
		return `class ${classDeclaration} {\n\t${this.body.map(expr => expr.toString()).join(';\n\t')}}\n`;
	}
	toJson(): object {
		return {
			body: this.body.map(expression => expression.toJSON()),
			className: this.className?.toJSON(),
			extendsClass: this.extendsClass?.toJSON(),
		};
	}
}
