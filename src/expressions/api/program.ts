import type {
	ExpressionEventPath, ExpressionNode, NodeDeserializer,
	SourceLocation, VisitNodeType
} from './expression.js';
import type { Stack } from '../scope/stack.js';
import { AbstractExpressionNode } from './abstract.js';
import { Deserializer } from './deserialize/deserialize.js';

export type ProgramSourceType = 'script' | 'module';

@Deserializer('Program')
export class Program extends AbstractExpressionNode {

	static fromJSON(node: Program, deserializer: NodeDeserializer): Program {
		return new Program(node.sourceType, node.body.map(deserializer), node.loc);
	}
	static visit(node: Program, visitNode: VisitNodeType): void {
		node.body.forEach(visitNode);
	}
	constructor(private sourceType: ProgramSourceType, private body: ExpressionNode[], loc?: SourceLocation) {
		super(loc);
	}
	set(stack: Stack, value: any): any {
		throw new Error(`Program#set() has no implementation.`);
	}
	get(stack: Stack): any {
		return this.body.map(statement => statement.get(stack)).at(-1);
	}

	dependency(computed?: true): ExpressionNode[] {
		return this.body.flatMap(statement => statement.dependency());
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.body.flatMap(statement => statement.dependencyPath());
	}
	toString(): string {
		return this.body.map(statement => statement.toString()).join('\n');
	}
	toJson(): object {
		return {
			sourceType: this.sourceType,
			body: this.body.map(statement => statement.toJSON())
		};
	}

}
