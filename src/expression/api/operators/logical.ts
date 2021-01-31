import type { ExpDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';


@Deserializer()
export class BinaryLogicalNode extends InfixExpressionNode {

    static fromJSON(node: BinaryLogicalNode, serializer: ExpDeserializer): BinaryLogicalNode {
        return new BinaryLogicalNode(
            node.op,
            serializer(node.left as any),
            serializer(node.right as any)
        );
    }


    static Evaluations: { [key: string]: (exp: BinaryLogicalNode, context: any) => any } = {

        '&&': (exp: BinaryLogicalNode, context: any) => {
            let value = exp.left.get(context);
            if (value) {
                value = exp.right.get(context);
                exp.set(context, value);
            }
            return value;
        },

        '||': (exp: BinaryLogicalNode, context: any) => {
            let value = exp.left.get(context);
            if (!value) {
                value = exp.right.get(context);
                exp.set(context, value);
            }
            return value;
        },

        '??': (exp: BinaryLogicalNode, context: any) => {
            let value = exp.left.get(context);
            if (value === undefined || value === null) {
                value = exp.right.get(context);
                exp.set(context, value);
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


@Deserializer()
export class LogicalAssignmentNode extends InfixExpressionNode {

    static fromJSON(node: LogicalAssignmentNode, serializer: ExpDeserializer): LogicalAssignmentNode {
        return new LogicalAssignmentNode(
            node.op,
            serializer(node.left as any),
            serializer(node.right as any)
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
