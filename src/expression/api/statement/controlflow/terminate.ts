import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { ScopedStack } from '../../scope.js';

/**
 * The break statement terminates the current loop, switch, or label statement
 * and transfers program control to the statement following the terminated statement.
 * 
 */
@Deserializer()
export class BreakNode extends AbstractExpressionNode {

    static KEYWORDS = ['break'];

    static INSTANCE = Object.freeze(new BreakNode()) as BreakNode;

    static fromJSON(node: BreakNode): BreakNode {
        if (BreakNode.INSTANCE) {
            return BreakNode.INSTANCE;
        }
        return BreakNode.INSTANCE = new BreakNode();
    }

    private break = BreakNode.KEYWORDS[0];

    constructor() {
        super();
    }

    set(stack: ScopedStack, value: any) {
        throw new Error(`BreakNode#set() has no implementation.`);
    }

    get(stack: ScopedStack) {
        return this.break;
    }

    entry(): string[] {
        return [];
    }

    event(parent?: string): string[] {
        return [];
    }

    toString(): string {
        return this.break;
    }

    toJson(): object {
        return { break: this.break };
    }

}


/**
 * The continue statement terminates execution of the statements in the current iteration of the current or labeled loop,
 * and continues execution of the loop with the next iteration.
 *
 */
@Deserializer()
export class ContinueNode extends AbstractExpressionNode {

    static KEYWORDS = ['continue'];

    static INSTANCE = Object.freeze(new ContinueNode()) as ContinueNode;

    static fromJSON(node: ContinueNode): ContinueNode {
        return node.labeled ? new ContinueNode(node.labeled) : ContinueNode.INSTANCE;
    }

    private continue = ContinueNode.KEYWORDS[0];

    constructor(private labeled?: string) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        throw new Error(`ContinueNode#set() has no implementation.`);
    }

    get(stack: ScopedStack) {
        return this.continue + this.labeled ? (' ' + this.labeled) : '';
    }

    entry(): string[] {
        return [];
    }

    event(parent?: string): string[] {
        return [];
    }

    toString(): string {
        return this.continue + this.labeled ? (' ' + this.labeled) : '';
    }

    toJson(): object {
        return {
            continue: this.continue,
            labeled: this.labeled
        };
    }

}
