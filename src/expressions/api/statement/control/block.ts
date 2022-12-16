import type {
	NodeDeserializer, ExpressionNode, ExpressionEventPath,
	VisitNodeType, SourceLocation
} from '../../expression.js';
import type { Stack } from '../../../scope/stack.js';
import { AbstractExpressionNode, ReturnValue } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { TerminateReturnType } from './terminate.js';
import { isDeclarationExpression } from '../../utils.js';

/**
 * A block statement (or compound statement in other languages) is used to group zero or more statements.
 * The block is delimited by a pair of braces ("curly brackets") and may optionally be labelled:
 */
@Deserializer('BlockStatement')
export class BlockStatement extends AbstractExpressionNode {
	static fromJSON(node: BlockStatement, deserializer: NodeDeserializer): BlockStatement {
		return new BlockStatement(node.body.map(deserializer), node.loc);
	}
	static visit(node: BlockStatement, visitNode: VisitNodeType): void {
		node.body.forEach(visitNode);
	}
	constructor(protected body: ExpressionNode[], loc?: SourceLocation) {
		super(loc);
	}
	getBody() {
		return this.body;
	}
	set(stack: Stack, value: any) {
		throw new Error(`BlockStatement#set() has no implementation.`);
	}
	get(stack: Stack) {
		const blockScope = stack.pushBlockScope();
		let value: any;
		for (const node of this.body) {
			value = node.get(stack);
			if (value instanceof ReturnValue) {
				stack.clearTo(blockScope);
				return value.value;
			}
			if (value instanceof TerminateReturnType) {
				return value;
			}
		}
		stack.clearTo(blockScope);
		return value;
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.body.flatMap(exp => exp.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.body.flatMap(node => node.dependencyPath(computed));
	}
	toString(): string {
		return `{\n${this.body
			.map(node => ({ insert: !isDeclarationExpression(node), string: node.toString() }))
			.map(ref => `  ${ref.string}${ref.insert ? ';' : ''}`)
			.join('\n')}\n}`;
	}
	toJson(): object {
		return { body: this.body.map(node => node.toJSON()) };
	}
}
