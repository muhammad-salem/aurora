import type { EvaluateNode, EvaluateType } from './types.js';
import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { StackProvider } from '../scope.js';

export type AssignmentOperator =
	'=' | '+=' | '-=' | '*=' | '**=' | '/=' | '%='
	| '<<=' | '>>=' | '>>>='
	| '|=' | '^=' | '&='
	| '||=' | '&&=' | '??='
	| '%%=' | '>?=' | '<?=';

@Deserializer('AssignmentExpression')
export class AssignmentNode extends InfixExpressionNode<AssignmentOperator>  {
	static fromJSON(node: AssignmentNode, deserializer: NodeDeserializer): AssignmentNode {
		return new AssignmentNode(
			node.operator,
			deserializer(node.left),
			deserializer(node.right)
		);
	}
	static Evaluations: EvaluateType = {

		'=': (evalNode: EvaluateNode) => { return evalNode.left = evalNode.right; },
		'*=': (evalNode: EvaluateNode) => { return evalNode.left *= evalNode.right; },
		'**=': (evalNode: EvaluateNode) => { return evalNode.left **= evalNode.right; },

		'/=': (evalNode: EvaluateNode) => { return evalNode.left /= evalNode.right; },
		'%=': (evalNode: EvaluateNode) => { return evalNode.left %= evalNode.right; },
		'%%=': (evalNode: EvaluateNode) => { return evalNode.left %= ((evalNode.left % evalNode.right) + evalNode.right) % evalNode.right; },

		'+=': (evalNode: EvaluateNode) => { return evalNode.left += evalNode.right; },
		'-=': (evalNode: EvaluateNode) => { return evalNode.left -= evalNode.right; },

		'<<=': (evalNode: EvaluateNode) => { return evalNode.left <<= evalNode.right; },
		'>>=': (evalNode: EvaluateNode) => { return evalNode.left >>= evalNode.right; },
		'>>>=': (evalNode: EvaluateNode) => { return evalNode.left >>>= evalNode.right; },

		'&=': (evalNode: EvaluateNode) => { return evalNode.left &= evalNode.right; },
		'^=': (evalNode: EvaluateNode) => { return evalNode.left ^= evalNode.right; },
		'|=': (evalNode: EvaluateNode) => { return evalNode.left |= evalNode.right; },

		'>?=': (evalNode: EvaluateNode) => { return evalNode.left = evalNode.left > evalNode.right ? evalNode.left : evalNode.right; },
		'<?=': (evalNode: EvaluateNode) => { return evalNode.left = evalNode.left > evalNode.right ? evalNode.right : evalNode.left; },

	};

	static LogicalEvaluations: { [key: string]: (exp: AssignmentNode, context: any) => any } = {

		'&&=': (exp: AssignmentNode, context: any) => {
			let value = exp.left.get(context);
			if (value) {
				value = exp.right.get(context);
				exp.set(context, value);
			}
			return value;
		},

		'||=': (exp: AssignmentNode, context: any) => {
			let value = exp.left.get(context);
			if (!value) {
				value = exp.right.get(context);
				exp.set(context, value);
			}
			return value;
		},

		'??=': (exp: AssignmentNode, context: any) => {
			let value = exp.left.get(context);
			if (value === undefined || value === null) {
				value = exp.right.get(context);
				exp.set(context, value);
			}
			return value;
		}

	};

	constructor(operator: AssignmentOperator, left: ExpressionNode, right: ExpressionNode) {
		super(operator, left, right);
	}
	set(stack: StackProvider, value: any) {
		return this.left.set(stack, value);
	}
	get(stack: StackProvider): any {
		switch (this.operator) {
			case '&&=':
			case '||=':
			case '??=':
				return AssignmentNode.LogicalEvaluations[this.operator](this, stack);
		}
		const evalNode: EvaluateNode = {
			left: this.left.get(stack),
			right: this.right.get(stack)
		};
		const value = AssignmentNode.Evaluations[this.operator](evalNode);
		this.set(stack, value);
		return value;
	}
}
