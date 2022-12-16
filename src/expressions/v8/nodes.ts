import type { ExpressionNode } from '../api/expression.js';
import type { Stack } from '../scope/stack.js';
import { Token, TokenExpression } from './token.js';
import { AssignmentExpression } from '../api/operators/assignment.js';
import { LogicalExpression } from '../api/operators/logical.js';
import { UnaryExpression } from '../api/operators/unary.js';
import { ConditionalExpression } from '../api/operators/ternary.js';
import { SequenceExpression } from '../api/operators/comma.js';
import { Literal } from '../api/definition/values.js';
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

export function creteCommaExpression(nodes: ExpressionNode[]): ExpressionNode {
	return new SequenceExpression(nodes);
}

const USELESS_STACK: Stack = null as unknown as Stack;//Object.create(null);
const ALLOWED_TYPES = ['string', 'number', 'bigint', 'boolean'];

export function shortcutNumericLiteralBinaryExpression(x: ExpressionNode, y: ExpressionNode, op: Token): ExpressionNode {
	const expression = creteInfixExpression(op.getName(), x, y);

	if (x instanceof Literal && y instanceof Literal) {
		const typeX = typeof x.getValue();
		const typeY = typeof y.getValue();
		if (x === y && ALLOWED_TYPES.indexOf(typeX) > -1) {
			const result = expression.get(USELESS_STACK);
			const rawString = `${x.toString()} ${op.getName()} ${x.toString()}`;
			return new Literal<any>(result, rawString);
		}
	}
	return expression!;
}
export function coverValue(value: any) {
	switch (typeof value) {
		case 'undefined': return new Literal<undefined>(undefined);
		case 'boolean': return new Literal<boolean>(value ? true : false);
		case 'number':
		case 'bigint':
		case 'string':
			return new Literal<number | string | bigint>(value);
		case 'object':
			if (value === null) {
				return new Literal<null>(null);
			}
		// never reach
		case 'function':
		case 'symbol':
		default:
			return false;
	}
}

export function buildUnaryExpression(expression: ExpressionNode, op: Token) {
	const name = op.getName();
	switch (name) {
		case '++':
		case '--':
			return new UpdateExpression(name, expression, true);
		case '+':
		case '-':
		case '!':
		case '~':
		case 'typeof':
		case 'void':
		case 'delete':
			return new UnaryExpression(name, expression);
		case 'await':
			return new AwaitExpression(expression);
		default:
			throw new Error(`${op} is not prefix operator`);
	}
}

export function buildPostfixExpression(expression: ExpressionNode, op: Token) {
	const name = op.getName();
	switch (name) {
		case '++':
		case '--':
			return new UpdateExpression(name, expression, false);
		default:
			throw new Error(`${op} is not postfix operator`);
	}
}

export function expressionFromLiteral(te: TokenExpression) {
	switch (te.token) {
		case Token.NUMBER:
		case Token.BIGINT:
		case Token.STRING:
		case Token.REGEXP_LITERAL:
		case Token.IDENTIFIER:
			return te.getValue();

		case Token.NULL_LITERAL: return new Literal<null>(null);
		case Token.TRUE_LITERAL: return new Literal<boolean>(true);
		case Token.FALSE_LITERAL: return new Literal<boolean>(false);
		default:
		case Token.UNDEFINED_LITERAL: return new Literal<undefined>(undefined);
	}
}
