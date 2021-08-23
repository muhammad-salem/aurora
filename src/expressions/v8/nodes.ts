import type { ExpressionNode } from '../api/expression.js';
import type { StackProvider } from '../api/scope.js';
import { AssignmentNode } from '../api/operators/assignment.js';
import { LogicalNode } from '../api/operators/logical.js';
import { UnaryNode } from '../api/operators/unary.js';
import { ConditionalExpressionNode } from '../api/operators/ternary.js';
import { PipelineNode } from '../api/operators/pipeline.js';
import { CommaNode } from '../api/operators/comma.js';
import { Token, TokenExpression } from './token.js';
import {
	AbstractLiteralNode, BigIntNode, NumberNode,
	BooleanNode, TrueNode, FalseNode,
	NullNode, StringNode, UndefinedNode
} from '../api/definition/values.js';
import { AwaitExpressionNode } from '../api/operators/await.js';
import { UpdateExpressionNode } from '../api/operators/update.js';
import { BinaryExpressionNode } from '../api/index.js';

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
			return new AssignmentNode(op, left, right);
		case '&&':
		case '||':
		case '??':
			return new LogicalNode(op, left, right);
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
		case '<=>':
			return new BinaryExpressionNode(op, left, right);
		default:
			throw new Error(`Not Supported Operator: ${op}`);
	}
}

export function createTernaryExpression(op: string, logical: ExpressionNode, ifTrue: ExpressionNode, ifFalse: ExpressionNode): ExpressionNode {
	switch (op) {
		case '?':
			return new ConditionalExpressionNode(logical, ifTrue, ifFalse);
		default:
			throw new Error(`${op} is not ternary operator`);

	}
}

export function createPipelineExpression(op: string, param: ExpressionNode, func: ExpressionNode, args?: ('?' | ExpressionNode)[]): ExpressionNode {
	switch (op) {
		case '|>':
			return new PipelineNode(param, func, args);
		default:
			throw new Error(`${op} is not pipeline operator`);

	}
}

export function cretePrefixExpression(op: string, node: ExpressionNode): ExpressionNode {
	switch (op) {
		case '++':
		case '--':
			return new UpdateExpressionNode(op, node, true);
		case '+':
		case '-':
		case '!':
		case '~':
		case 'typeof':
		case 'void':
		case 'delete':
			return new UnaryNode(op, node);
		case 'await':
			return new AwaitExpressionNode(node);
		default:
			throw new Error(`${op} is not prefix operator`);
	}
}

export function cretePostfixExpression(op: string, node: ExpressionNode): ExpressionNode {
	switch (op) {
		case '++':
		case '--':
			return new UpdateExpressionNode(op, node, false);
		default:
			throw new Error(`${op} is not postfix operator`);
	}
}

export function creteCommaExpression(nodes: ExpressionNode[]): ExpressionNode {
	return new CommaNode(nodes);
}

const USELESS_SCOPE: StackProvider = null as unknown as StackProvider;//Object.create(null);

export function shortcutNumericLiteralBinaryExpression(x: ExpressionNode, y: ExpressionNode, op: Token): ExpressionNode {
	const expression = creteInfixExpression(op.getName(), x, y);
	if (expression
		&& (
			(x instanceof NumberNode && y instanceof NumberNode)
			|| (x instanceof StringNode && y instanceof StringNode)
			|| (x instanceof BigIntNode && y instanceof BigIntNode)
			|| (x instanceof BooleanNode && y instanceof BooleanNode)
		)) {
		const result = expression.get(USELESS_SCOPE);
		if (result !== false) {
			return result;
		}
	}
	return expression!;
}
export function coverValue(value: any) {
	switch (typeof value) {
		case 'undefined': return UndefinedNode;
		case 'boolean': return value ? TrueNode : FalseNode;
		case 'number': return new NumberNode(value);
		case 'bigint': return new BigIntNode(value);
		case 'string': return new StringNode(value);
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
	if (expression instanceof AbstractLiteralNode) {
		const value = result.get(USELESS_SCOPE);
		const temp = coverValue(value);
		if (temp !== false) {
			result = temp;
		}
	}
	return result;
}

export function buildPostfixExpression(expression: ExpressionNode, op: Token) {
	let result = cretePostfixExpression(op.getName(), expression);
	if (expression instanceof AbstractLiteralNode) {
		const value = result.get(USELESS_SCOPE);
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
