import type { ExpressionNode } from '../api/expression.js';
import type { ScopedStack } from '../api/scope.js';
import { InfixExpressionNode } from '../api/abstract.js';
import { ArithmeticNode, PostfixNode, PrefixNode } from '../api/operators/arithmetic.js';
import { AssignmentNode } from '../api/operators/assignment.js';
import { EqualityNode } from '../api/operators/equality.js';
import { LogicalAssignmentNode, LogicalNode } from '../api/operators/logical.js';
import { RelationalNode, ThreeWayComparisonNode } from '../api/operators/relational.js';
import { BinaryBitwiseNode, BitwiseShiftNode } from '../api/operators/shift.js';
import { LiteralUnaryNode, UnaryNode } from '../api/operators/unary.js';
import { TernaryNode } from '../api/operators/ternary.js';
import { PipelineNode } from '../api/operators/pipeline.js';
import { CommaNode } from '../api/operators/comma.js';
import { Token, TokenExpression } from './token.js';
import { AbstractLiteralNode, BigIntNode, BooleanNode, FalseNode, NullNode, NumberNode, StringNode, TrueNode, UndefinedNode } from '../api/definition/values.js';

export function creteInfixExpression(op: string, left: ExpressionNode, right: ExpressionNode): InfixExpressionNode | false {
	switch (op) {
		case '**':
		case '*':
		case '/':
		case '%':
		case '+':
		case '-':
			return new ArithmeticNode(op, left, right);
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
			return new AssignmentNode(op, left, right);
		case '==':
		case '!=':
		case '===':
		case '!==':
			return new EqualityNode(op, left, right);
		case '&&':
		case '||':
		case '??':
			return new LogicalNode(op, left, right);
		case '&&=':
		case '||=':
		case '??=':
			return new LogicalAssignmentNode(op, left, right);
		case '<=>':
			return new ThreeWayComparisonNode(op, left, right);
		case '<':
		case '<=':
		case '>':
		case '>=':
		case 'in':
		case 'instanceof':
			return new RelationalNode(op, left, right);
		case '<<':
		case '>>':
		case '>>>':
			return new BitwiseShiftNode(op, left, right);
		case '&':
		case '^':
		case '|':
			return new BinaryBitwiseNode(op, left, right);
		default:
			return false;
	}
}

export function createTernaryExpression(op: string, logical: ExpressionNode, ifTrue: ExpressionNode, ifFalse: ExpressionNode): ExpressionNode {
	switch (op) {
		case '?':
			return new TernaryNode(logical, ifTrue, ifFalse);
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
			return new PrefixNode(op, node);
		case '+':
		case '-':
		case '!':
		case '~':
			return new UnaryNode(op, node);
		case 'typeof':
		case 'void':
		case 'delete':
		case 'await':
			return new LiteralUnaryNode(op, node);
		default:
			throw new Error(`${op} is not prefix operator`);
	}
}

export function cretePostfixExpression(op: string, node: ExpressionNode): ExpressionNode {
	switch (op) {
		case '++':
		case '--':
			return new PostfixNode(op, node);
		default:
			throw new Error(`${op} is not postfix operator`);
	}
}

export function creteCommaExpression(op: string, nodes: ExpressionNode[]): ExpressionNode | false {
	switch (op) {
		case ',':
			return new CommaNode(nodes);
		default:
			return false;
	}
}

const USELESS_SCOPE: ScopedStack = null as unknown as ScopedStack;//Object.create(null);

export function shortcutNumericLiteralBinaryExpression(x: ExpressionNode, y: ExpressionNode, op: Token): ExpressionNode | false {
	const expression = creteInfixExpression(op.getName(), x, y);
	if (expression
		&& (
			(x instanceof NumberNode && y instanceof NumberNode)
			|| (x instanceof StringNode && y instanceof StringNode)
			|| (x instanceof BigIntNode && y instanceof BigIntNode)
			|| (x instanceof BooleanNode && y instanceof BooleanNode)
		)) {
		const result = expression.get(USELESS_SCOPE);
		return coverValue(result);
	}
	return expression;
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
	if (expression instanceof AbstractLiteralNode) {
		const value = expression.get();
		return coverValue(value);
	}
	return cretePrefixExpression(op.getName(), expression);
}

export function buildPostfixExpression(expression: ExpressionNode, op: Token) {
	if (expression instanceof AbstractLiteralNode) {
		const value = expression.get();
		return coverValue(value);
	}
	return cretePostfixExpression(op.getName(), expression);
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
