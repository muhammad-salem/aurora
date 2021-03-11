import type { ExpressionNode } from '../api/expression.js';
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

export function creteInfixExpression(op: string, left: ExpressionNode, right: ExpressionNode): InfixExpressionNode {
	// const right = tokens.pop()!.getExpressionNode();
	// const op = tokens.pop()!.asString();
	// const left = tokens.pop()!.getExpressionNode();
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
			throw new Error(`${op} is not infix operator`);
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

export function createPipelineExpression(op: string, param: ExpressionNode, func: ExpressionNode, args?: ExpressionNode[], index?: number): ExpressionNode {
	switch (op) {
		case '|>':
			return new PipelineNode(param, func, args, index);
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

