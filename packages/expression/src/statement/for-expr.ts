import { NodeExpression } from '../expression.js';
import { Evaluate, EvaluateNode, InfixOperators } from '../operators/infix.js';


export class CommaOperators extends InfixOperators {

    static Evaluations: Evaluate = {
        /**
         * for (let i = 0, j = 9; i < 10; i++, j--)
         */
        ',': (evalNode: EvaluateNode) => { return evalNode.left, evalNode.right; },
    };

    static Operators = Object.keys(CommaOperators.Evaluations);

    constructor(op: string, left: NodeExpression, right: NodeExpression) {
        if (!(op in CommaOperators.Operators)) {
            throw new Error(`[${op}]: operation not implmented yet`);
        }
        super(op, left, right, CommaOperators.Evaluations[op]);
    }
}