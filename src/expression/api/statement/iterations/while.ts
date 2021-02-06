import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { ScopedStack } from '../../scope.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { TerminateNode } from '../controlflow/terminate.js';

/**
 * The while statement creates a loop that executes a specified
 * statement as long as the test condition evaluates to true.
 * The condition is evaluated before executing the statement.
 * 
 */
@Deserializer('while')
export class WhileNode extends AbstractExpressionNode {

    static KEYWORDS = ['while'];

    static fromJSON(node: WhileNode, deserializer: NodeDeserializer): WhileNode {
        return new WhileNode(
            deserializer(node.condition as any),
            deserializer(node.statement as any),
            node.elseIf ? deserializer(node.elseIf as any) : void 0
        );
    }


    constructor(private condition: ExpressionNode, private statement: ExpressionNode,
        private elseIf?: ExpressionNode) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        throw new Error(`WhileNode#set() has no implementation.`);
    }

    get(stack: ScopedStack) {
        stack = stack.newStack();
        const condition = this.condition.get(stack);
        while (condition) {
            const symbol = this.statement.get(stack);
            // useless case, as it at the end of for statement
            // an array/block statement, should return last signal
            if (TerminateNode.ContinueSymbol === symbol) {
                continue;
            }
            if (TerminateNode.BreakSymbol === symbol) {
                break;
            }
        }
        return void 0;
    }

    entry(): string[] {
        return [];
    }

    event(parent?: string): string[] {
        return [];
    }

    toString(): string {
        return `while (${this.condition.toString()}) ${this.statement.toString()}`;
    }

    toJson(): object {
        return {
            condition: this.condition.toJSON(),
            statement: this.statement.toJSON()
        };
    }

}
