import { AbstractExpressionNode } from '../abstract';
import { Deserializer } from '../deserialize/deserialize';
import type { ExpressionNode, NodeDeserializer } from '../expression';
import type { StackProvider } from '../scope';

export type ProgramSourceType = 'script' | 'module';

@Deserializer('Program')
export class ProgramNode extends AbstractExpressionNode {

	static fromJSON(node: ProgramNode, deserializer: NodeDeserializer): ProgramNode {
		return new ProgramNode(node.sourceType, node.body.map(deserializer));
	}
	constructor(private sourceType: ProgramSourceType, private body: ExpressionNode[]) {
		super();
	}

	set(stack: StackProvider, value: any): any {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}
	get(stack: StackProvider, thisContext?: any): any {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}
	entry(): string[] {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}
	event(parent?: string): string[] {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}
	toString(): string {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}
	toJson(key?: string): { [key: string]: any } {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}

}