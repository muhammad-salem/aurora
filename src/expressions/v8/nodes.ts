import type { ExpressionNode } from '../api/expression.js';
import type { Stack } from '../scope/stack.js';
import { Token, TokenExpression } from './token.js';
import { AssignmentExpression } from '../api/operators/assignment.js';
import { LogicalExpression } from '../api/operators/logical.js';
import { UnaryExpression } from '../api/operators/unary.js';
import { ConditionalExpression } from '../api/operators/ternary.js';
import { SequenceExpression } from '../api/operators/comma.js';
import {
	Literal, BigIntLiteral, NumberLiteral,
	BooleanLiteral, TrueNode, FalseNode,
	NullNode, StringLiteral, UndefinedNode
} from '../api/definition/values.js';
import { AwaitExpression } from '../api/operators/await.js';
import { UpdateExpression } from '../api/operators/update.js';
import { BinaryExpression } from '../api/operators/binary.js';

export function creteInfixExpression(op: string, left: ExpressionNode, right: ExpressionNode): ExpressionNode {
	switch (op) {
		case '=':
		case '+=':
		case '-=':
		case '**=':
		case '/=':
		case '%=':
		case '<<=':
		case '>>=':
		case '>>>=':
		case '&=':
		case '^=':
		case '|=':
		case '&&=':
		case '||=':
		case '??=':
			return new AssignmentExpression(op, left, right);
		case '&&':
		case '||':
		case '??':
			return new LogicalExpression(op, left, right);
		case '**':
		case '*':
		case '/':
		case '%':
		case '+':
		case '-':
		case '<':
		case '<=':
		case '>':
		case '>=':
		case 'in':
		case 'instanceof':
		case '==':
		case '!=':
		case '===':
		case '!==':
		case '<<':
		case '>>':
		case '>>>':
		case '&':
		case '^':
		case '|':
		case '>?':
		case '<?':
		case '<=>':
			return new BinaryExpression(op, left, right);
		default:
			throw new Error(`Not Supported Operator: ${op}`);
	}
}

export function createTernaryExpression(op: string, logical: ExpressionNode, ifTrue: ExpressionNode, ifFalse: ExpressionNode): ExpressionNode {
	switch (op) {
		case '?':
			return new ConditionalExpression(logical, ifTrue, ifFalse);
		default:
			throw new Error(`${op} is not ternary operator`);

	}
}

export function cretePrefixExpression(op: string, node: ExpressionNode): ExpressionNode {
	switch (op) {
		case '++':
		case '--':
			return new UpdateExpression(op, node, true);
		case '+':
		case '-':
		case '!':
		case '~':
		case 'typeof':
		case 'void':
		case 'delete':
			return new UnaryExpression(op, node);
		case 'await':
			return new AwaitExpression(node);
		default:
			throw new Error(`${op} is not prefix operator`);
	}
}

export function cretePostfixExpression(op: string, node: ExpressionNode): ExpressionNode {
	switch (op) {
		case '++':
		case '--':
			return new UpdateExpression(op, node, false);
		default:
			throw new Error(`${op} is not postfix operator`);
	}
}

export function creteCommaExpression(nodes: ExpressionNode[]): ExpressionNode {
	return new SequenceExpression(nodes);
}

const USELESS_STACK: Stack = null as unknown as Stack;//Object.create(null);

export function shortcutNumericLiteralBinaryExpression(x: ExpressionNode, y: ExpressionNode, op: Token): ExpressionNode {
	const expression = creteInfixExpression(op.getName(), x, y);
	if (expression
		&& (
			(x instanceof NumberLiteral && y instanceof NumberLiteral)
			|| (x instanceof StringLiteral && y instanceof StringLiteral)
			|| (x instanceof BigIntLiteral && y instanceof BigIntLiteral)
			|| (x instanceof BooleanLiteral && y instanceof BooleanLiteral)
		)) {
		const result = expression.get(USELESS_STACK);
		if (result !== false) {
			switch (true) {
				case typeof result === 'number': return new NumberLiteral(result);
				case typeof result === 'string': return new StringLiteral(result);
				case typeof result === 'bigint': return new BigIntLiteral(result);
				case typeof result === 'boolean': return result ? TrueNode : FalseNode;
				default:
					break;
			}
		}
	}
	return expression!;
}
export function coverValue(value: any) {
	switch (typeof value) {
		case 'undefined': return UndefinedNode;
		case 'boolean': return value ? TrueNode : FalseNode;
		case 'number': return new NumberLiteral(value);
		case 'bigint': return new BigIntLiteral(value);
		case 'string': return new StringLiteral(value);
		case 'object':
			if (value === null) {
				return NullNode;
			}
		// never reach
		case 'function':
		case 'symbol':
		default:
			return false;
	}
}

export function buildUnaryExpression(expression: ExpressionNode, op: Token) {
	let result = cretePrefixExpression(op.getName(), expression);
	if (expression instanceof Literal) {
		const value = result.get(USELESS_STACK);
		const temp = coverValue(value);
		if (temp !== false) {
			result = temp;
		}
	}
	return result;
}

export function buildPostfixExpression(expression: ExpressionNode, op: Token) {
	let result = cretePostfixExpression(op.getName(), expression);
	if (expression instanceof Literal) {
		const value = result.get(USELESS_STACK);
		const temp = coverValue(value);
		if (temp !== false) {
			result = temp;
		}
	}
	return result;
}

export function expressionFromLiteral(te: TokenExpression) {
	switch (te.token) {
		case Token.NUMBER:
		case Token.BIGINT:
		case Token.STRING:
		case Token.REGEXP_LITERAL:
		case Token.IDENTIFIER:
			return te.getValue();

		case Token.NULL_LITERAL: return NullNode;
		case Token.TRUE_LITERAL: return TrueNode;
		case Token.FALSE_LITERAL: return FalseNode;
		default:
		case Token.UNDEFINED_LITERAL: return UndefinedNode;
	}
}
