import type { ExpressionEventPath, ExpressionNode, NodeDeserializer } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

export type ProgramSourceType = 'script' | 'module';

@Deserializer('Program')
export class Program extends AbstractExpressionNode {

	static fromJSON(node: Program, deserializer: NodeDeserializer): Program {
		return new Program(node.sourceType, node.body.map(deserializer));
	}
	constructor(private sourceType: ProgramSourceType, private body: ExpressionNode[]) {
		super();
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack, value: any): any {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}
	get(stack: Stack, thisContext?: any): any {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}

	dependency(): ExpressionNode[] {
		throw new Error('Method not implemented.');
	}
	dependencyPath(computed: true): ExpressionEventPath[] {
		throw new Error('Method not implemented.');
	}
	toString(): string {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}
	toJson(): { [key: string]: any } {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}

}