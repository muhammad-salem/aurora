import type { EvaluateNode, EvaluateType } from './types.js';
import type { Stack } from '../scope.js';
import type { NodeDeserializer } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

export type BinaryOperator =
	'==' | '!=' | '===' | '!=='
	| '<' | '<=' | '>' | '>='
	| '<<' | '>>' | '>>>'
	| '+' | '-' | '*' | '/' | '%'
	| '|' | '^' | '&' | 'in'
	| 'instanceof'
	| '**' | '%%' | '>?' | '<?' | '<=>';

@Deserializer('BinaryExpression')
export class BinaryExpressionNode extends InfixExpressionNode<BinaryOperator> {
	static fromJSON(node: BinaryExpressionNode, deserializer: NodeDeserializer): BinaryExpressionNode {
		return new BinaryExpressionNode(
			node.operator,
			deserializer(node.left),
			deserializer(node.right)
		);
	}
	static Evaluations: EvaluateType = {
		'==': (evalNode: EvaluateNode) => { return evalNode.left == evalNode.right; },
		'!=': (evalNode: EvaluateNode) => { return evalNode.left != evalNode.right; },

		'===': (evalNode: EvaluateNode) => { return evalNode.left === evalNode.right; },
		'!==': (evalNode: EvaluateNode) => { return evalNode.left !== evalNode.right; },

		'*': (evalNode: EvaluateNode) => { return evalNode.left * evalNode.right; },
		'/': (evalNode: EvaluateNode) => { return evalNode.left / evalNode.right; },
		'%': (evalNode: EvaluateNode) => { return evalNode.left % evalNode.right; },

		'+': (evalNode: EvaluateNode) => { return evalNode.left + evalNode.right; },
		'-': (evalNode: EvaluateNode) => { return evalNode.left - evalNode.right; },

		'<': (evalNode: EvaluateNode) => { return evalNode.left < evalNode.right; },
		'<=': (evalNode: EvaluateNode) => { return evalNode.left <= evalNode.right; },

		'>': (evalNode: EvaluateNode) => { return evalNode.left > evalNode.right; },
		'>=': (evalNode: EvaluateNode) => { return evalNode.left >= evalNode.right; },

		'in': (evalNode: EvaluateNode) => { return evalNode.left in evalNode.right; },
		'instanceof': (evalNode: EvaluateNode) => { return evalNode.left instanceof evalNode.right; },

		'<<': (evalNode: EvaluateNode) => { return evalNode.left << evalNode.right; },
		'>>': (evalNode: EvaluateNode) => { return evalNode.left >> evalNode.right; },
		'>>>': (evalNode: EvaluateNode) => { return evalNode.left >>> evalNode.right; },

		'&': (evalNode: EvaluateNode) => { return evalNode.left & evalNode.right; },
		'^': (evalNode: EvaluateNode) => { return evalNode.left ^ evalNode.right; },
		'|': (evalNode: EvaluateNode) => { return evalNode.left | evalNode.right; },

		'**': (evalNode: EvaluateNode) => { return evalNode.left ** evalNode.right; },
		'%%': (evalNode: EvaluateNode) => { return ((evalNode.left % evalNode.right) + evalNode.right) % evalNode.right; },
		'>?': (evalNode: EvaluateNode) => { return evalNode.left > evalNode.right ? evalNode.left : evalNode.right; },
		'<?': (evalNode: EvaluateNode) => { return evalNode.left > evalNode.right ? evalNode.right : evalNode.left; },
		'<=>': (evalNode: EvaluateNode) => {
			if ((evalNode.left === null || evalNode.right === null) || (typeof evalNode.left != typeof evalNode.right)) {
				return null;
			}
			if (typeof evalNode.left === 'string') {
				return evalNode.left.localeCompare(evalNode.right);
			} else {
				if (evalNode.left > evalNode.right) {
					return 1;
				} else if (evalNode.left < evalNode.right) {
					return -1;
				}
				return 0;
			}
		}
	};
	set(context: object, value: any) {
		throw new Error(`BinaryExpressionNode#set() for operator:(${this.operator}) has no implementation.`);
	}
	get(stack: Stack): any {
		const evalNode: EvaluateNode = {
			left: this.left.get(stack),
			right: this.right.get(stack)
		};
		return BinaryExpressionNode.Evaluations[this.operator](evalNode);
	}
}
