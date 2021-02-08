import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';


@Deserializer('logical')
export class BinaryLogicalNode extends InfixExpressionNode {

    static fromJSON(node: BinaryLogicalNode, deserializer: NodeDeserializer): BinaryLogicalNode {
        return new BinaryLogicalNode(
            node.op,
            deserializer(node.left),
            deserializer(node.right)
        );
    }

    static Evaluations: { [key: string]: (exp: BinaryLogicalNode, context: any) => any } = {

        '&&': (exp: BinaryLogicalNode, context: any) => {
            let value = exp.left.get(context);
            if (value) {
                value = exp.right.get(context);
            }
            return value;
        },

        '||': (exp: BinaryLogicalNode, context: any) => {
            let value = exp.left.get(context);
            if (!value) {
                value = exp.right.get(context);
            }
            return value;
        },

        '??': (exp: BinaryLogicalNode, context: any) => {
            let value = exp.left.get(context);
            if (value === undefined || value === null) {
                value = exp.right.get(context);
            }
            return value;
        }

    };

    static KEYWORDS = Object.keys(BinaryLogicalNode.Evaluations);

    constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
        if (!(BinaryLogicalNode.KEYWORDS.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation yet`);
        }
        super(op, left, right);
    }

    get(context: object) {
        return BinaryLogicalNode.Evaluations[this.op](this, context);
    }

    evalNode() {
        throw new Error('no need for this method in LogicalNode class');
    }

}


@Deserializer('logical-assign')
export class LogicalAssignmentNode extends InfixExpressionNode {

    static fromJSON(node: LogicalAssignmentNode, deserializer: NodeDeserializer): LogicalAssignmentNode {
        return new LogicalAssignmentNode(
            node.op,
            deserializer(node.left),
            deserializer(node.right)
        );
    }

    static Evaluations: { [key: string]: (exp: LogicalAssignmentNode, context: any) => any } = {

        '&&=': (exp: LogicalAssignmentNode, context: any) => {
            let value = exp.left.get(context);
            if (value) {
                value = exp.right.get(context);
                exp.set(context, value);
            }
            return value;
        },

        '||=': (exp: LogicalAssignmentNode, context: any) => {
            let value = exp.left.get(context);
            if (!value) {
                value = exp.right.get(context);
                exp.set(context, value);
            }
            return value;
        },

        '??=': (exp: LogicalAssignmentNode, context: any) => {
            let value = exp.left.get(context);
            if (value === undefined || value === null) {
                value = exp.right.get(context);
                exp.set(context, value);
            }
            return value;
        }

    };

    static KEYWORDS = Object.keys(LogicalAssignmentNode.Evaluations);

    constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
        if (!(LogicalAssignmentNode.KEYWORDS.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation yet`);
        }
        super(op, left, right);
    }

    get(context: object) {
        return LogicalAssignmentNode.Evaluations[this.op](this, context);
    }

    evalNode() {
        throw new Error('no need for this method in LogicalNode class');
    }

}
