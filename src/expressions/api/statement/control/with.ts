import type {
	NodeDeserializer, ExpressionNode, ExpressionEventPath,
	VisitNodeType, SourceLocation
} from '../../expression.js';
import type { Stack } from '../../../scope/stack.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';

/**
 * The with statement extends the scope chain for a statement.
 */
@Deserializer('WithStatement')
export class WithStatement extends AbstractExpressionNode {
	static fromJSON(node: WithStatement, deserializer: NodeDeserializer): WithStatement {
		return new WithStatement(
			deserializer(node.object),
			deserializer(node.body),
			node.range,
			node.loc
		);
	}
	static visit(node: WithStatement, visitNode: VisitNodeType): void {
		visitNode(node.object);
		visitNode(node.body);
	}
	constructor(
		protected object: ExpressionNode,
		protected body: ExpressionNode,
		range?: [number, number],
		loc?: SourceLocation) {
		super(range, loc);
	}
	getObject() {
		return this.object;
	}
	getBody() {
		return this.body;
	}
	set(stack: Stack, value: any) {
		throw new Error(`WithStatement#set() has no implementation.`);
	}
	get(stack: Stack) {
		const object = this.object.get(stack);
		const objectScope = stack.pushBlockScopeFor(object);
		objectScope.getContextProxy = () => object;
		const value = this.body.get(stack);
		stack.clearTo(objectScope);
		return value;
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.object.dependency(computed).concat(this.body.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.object.dependencyPath(computed).concat(this.body.dependencyPath(computed));
	}
	toString(): string {
		return `with (${this.object.toString()}) ${this.body.toString()}`;
	}
	toJson(): object {
		return {
			object: this.object.toJSON(),
			body: this.body.toJSON()
		};
	}
}
