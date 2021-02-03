import type { ExpressionDeserializer, ExpressionNode } from '../../expression.js';
import type { ScopedStack } from '../../scope.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { TerminateNode } from '../controlflow/terminate.js';

/**
 * The if statement executes a statement if a specified condition is truthy.
 * If the condition is falsy, another statement can be executed.
 * 
 */
@Deserializer()
export class ForNode extends AbstractExpressionNode {

    static KEYWORDS = ['for'];

    static fromJSON(node: ForNode, deserializer: ExpressionDeserializer): ForNode {
        return new ForNode(
            deserializer(node.statement as any),
            node.initialization ? deserializer(node.initialization as any) : void 0,
            node.condition ? deserializer(node.condition as any) : void 0,
            node.finalExpression ? deserializer(node.finalExpression as any) : void 0
        );
    }


    constructor(private statement: ExpressionNode,
        private initialization?: ExpressionNode,
        private condition?: ExpressionNode,
        private finalExpression?: ExpressionNode) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        throw new Error(`ForNode#set() has no implementation.`);
    }

    get(stack: ScopedStack) {
        stack = stack.newStack();
        for (this.initialization?.get(stack); this.condition?.get(stack) || true; this.finalExpression?.get(stack)) {
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
        return `for (${this.initialization?.toString()};${this.condition?.toString()};${this.initialization?.toString()}) ${this.statement.toString()}`;
    }

    toJson(): object {
        return {
            statement: this.statement.toJSON(),
            initialization: this.initialization?.toJSON(),
            condition: this.condition?.toJSON(),
            finalExpression: this.finalExpression?.toJSON(),
        };
    }

}

@Deserializer()
export class ForOfNode extends AbstractExpressionNode {

    static KEYWORDS = ['for', 'of'];

    static fromJSON(node: ForOfNode, deserializer: ExpressionDeserializer): ForOfNode {
        return new ForOfNode(
            deserializer(node.variable as any),
            deserializer(node.iterable as any),
            deserializer(node.statement as any)
        );
    }


    // variable of iterable
    constructor(private variable: ExpressionNode,
        private iterable: ExpressionNode,
        private statement: ExpressionNode) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        throw new Error(`ForOfNode#set() has no implementation.`);
    }

    get(stack: ScopedStack) {
        const iterable = <any[]>this.iterable.get(stack);
        for (const iterator of iterable) {
            const forOfStack = stack.newStack();
            this.variable.set(forOfStack, iterable);
            const symbol = this.statement.get(forOfStack);
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
        return `for (${this.variable?.toString()} of ${this.iterable.toString()}) ${this.statement.toString()}`;
    }

    toJson(): object {
        return {
            variable: this.variable.toJSON(),
            iterable: this.iterable.toJSON(),
            statement: this.statement.toJSON(),
        };
    }

}


@Deserializer()
export class ForInNode extends AbstractExpressionNode {

    static KEYWORDS = ['for', 'in'];

    static fromJSON(node: ForInNode, deserializer: ExpressionDeserializer): ForInNode {
        return new ForInNode(
            deserializer(node.variable as any),
            deserializer(node.object as any),
            deserializer(node.statement as any)
        );
    }


    // variable of iterable
    constructor(private variable: ExpressionNode,
        private object: ExpressionNode,
        private statement: ExpressionNode) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        throw new Error(`ForOfNode#set() has no implementation.`);
    }

    get(stack: ScopedStack) {
        const iterable = <object>this.object.get(stack);
        for (const iterator in iterable) {
            const forOfStack = stack.newStack();
            this.variable.set(forOfStack, iterable);
            const symbol = this.statement.get(forOfStack);
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
        return `for (${this.variable?.toString()} in ${this.object.toString()}) ${this.statement.toString()}`;
    }

    toJson(): object {
        return {
            variable: this.variable.toJSON(),
            object: this.object.toJSON(),
            statement: this.statement.toJSON(),
        };
    }

}

@Deserializer()
export class ForAwaitOfNode extends AbstractExpressionNode {

    static KEYWORDS = ['for', 'await'];

    static fromJSON(node: ForAwaitOfNode, deserializer: ExpressionDeserializer): ForAwaitOfNode {
        return new ForAwaitOfNode(
            deserializer(node.variable as any),
            deserializer(node.iterable as any),
            deserializer(node.statement as any)
        );
    }


    // variable of iterable
    constructor(private variable: ExpressionNode,
        private iterable: ExpressionNode,
        private statement: ExpressionNode) {
        super();
    }

    set(stack: ScopedStack, value: any) {
        throw new Error(`ForAwaitOfNode#set() has no implementation.`);
    }

    get(stack: ScopedStack) {
        const iterable: { [Symbol.asyncIterator](): AsyncIterator<any> } = this.iterable.get(stack);
        (async () => {
            for await (const iterator of iterable) {
                const forOfStack = stack.newStack();
                this.variable.set(forOfStack, iterable);
                const symbol = this.statement.get(forOfStack);
                // useless case, as it at the end of for statement
                // an array/block statement, should return last signal
                if (TerminateNode.ContinueSymbol === symbol) {
                    continue;
                }
                if (TerminateNode.BreakSymbol === symbol) {
                    break;
                }
            }
        })();
        return void 0;
    }

    entry(): string[] {
        return [];
    }

    event(parent?: string): string[] {
        return [];
    }

    toString(): string {
        return `for (${this.variable?.toString()} of ${this.iterable.toString()}) ${this.statement.toString()}`;
    }

    toJson(): object {
        return {
            variable: this.variable.toJSON(),
            iterable: this.iterable.toJSON(),
            statement: this.statement.toJSON(),
        };
    }

}