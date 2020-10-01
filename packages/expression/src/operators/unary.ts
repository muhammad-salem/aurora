/**
 * Unary operators:
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators#Arithmetic
 *
 * Increment (++)	Unary operator. Adds one to its operand. If used as a prefix operator (++x), returns the value of its operand after adding one; if used as a postfix operator (x++), returns the value of its operand before adding one.	If x is 3, then ++x sets x to 4 and returns 4, whereas x++ returns 3 and, only then, sets x to 4.
 * Decrement (--)	Unary operator. Subtracts one from its operand. The return value is analogous to that for the increment operator.	If x is 3, then --x sets x to 2 and returns 2, whereas x-- returns 3 and, only then, sets x to 2.
 * Unary negation (-)	Unary operator. Returns the negation of its operand.	If x is 3, then -x returns -3.
 * Unary plus (+)	Unary operator. Attempts to convert the operand to a number, if it is not already.	+"3" returns 3. +true returns 1.
 *
 * Bitwise NOT	~ a	Inverts the bits of its operand.
 *
 * Logical NOT (!)	!expr	Returns false if its single operand that can be converted to true; otherwise, returns true.
 *
 * delete operator deletes an object's property
 *
 * ++x;
 * x++;
 * --x;
 * x--
 * delete x.property;
 * typeof x
 * void (expression)
 * ~a
 * !a
 * +a
 * -a
 * x ? y:z;
 */

import { NodeExpression, ValueNode } from '../expression.js';
import { MemberNode } from './infix.js';

export enum UnaryType {
    PREFIX,
    INFIX,
    POSTFIX
}

interface EvaluateType {
    [key: string]: (node: any) => any;
}

export class IncrementDecrementOperators implements NodeExpression {

    static Evaluations: EvaluateType = {
        '++': (value: number) => { return ++value; },
        '--': (value: number) => { return --value; }
    };

    static Operators = Object.keys(IncrementDecrementOperators.Evaluations);

    static parse(tokens: (NodeExpression | string)[]) {
        IncrementDecrementOperators.Operators.forEach(op => {
            // assume that tokens.length = 2;
            for (let i = -1; (i = tokens.indexOf(op, i + 1)) > -1;) {
                let pre = tokens[i - 1], post = tokens[i + 1];
                if (typeof post === 'object') {
                    tokens.splice(i, 2,
                        new IncrementDecrementOperators(op, post, UnaryType.PREFIX)
                    );
                } else if (typeof pre === 'object') {
                    tokens.splice(i - 1, 2,
                        new IncrementDecrementOperators(op, pre, UnaryType.POSTFIX)
                    );
                }
            }
        });
    }

    constructor(public op: string, public node: NodeExpression, public unaryType: UnaryType) { }
    set(context: object, value: any) {
        this.node.set(context, value);
    }
    get(context: object) {
        let value = this.node.get(context);
        let opValue = IncrementDecrementOperators.Evaluations[this.op](value);
        this.set(context, opValue);
        if (this.unaryType === UnaryType.PREFIX) {
            value = opValue;
        }
        return value;
    }
    toString() {
        let str: string;
        if (this.unaryType === UnaryType.POSTFIX) {
            str = `${this.node.toString()}${this.op}`;
        } else {
            str = `${this.op}${this.node.toString()}`;
        }
        return str;
    }
}

export class UnaryOperators implements NodeExpression {

    static Evaluations: EvaluateType = {
        '+': (value: string) => { return +value; },
        '-': (value: number) => { return -value; },
        '~': (value: number) => { return ~value; },
        '!': (value: any) => { return !value; },
        // // 'delete': (value: any) => { return delete value; },
        // // 'typeof': (value: any) => { return typeof value; },
        // // 'void': (value: any) => { return void value; },
    };

    static Operators = Object.keys(UnaryOperators.Evaluations);

    static parse(tokens: (NodeExpression | string)[], ignore?: string[]) {
        UnaryOperators.Operators.forEach(op => {
            if (ignore && ignore.includes(op)) {
                return;
            }
            for (let i = -1; (i = tokens.indexOf(op, i + 1)) > -1;) {
                let pre = tokens[i - 1], post = tokens[i + 1];
                if (typeof pre === 'object' && typeof post === 'object') {

                } else if (typeof post === 'object') {
                    tokens.splice(i, 2, new UnaryOperators(op, post));
                }
            }
        });
    }

    constructor(public op: string, public node: NodeExpression) { }
    set(context: object, value: any) {
        return this.node.set(context, value);
    }
    get(context: object) {
        let value = this.node.get(context);
        return UnaryOperators.Evaluations[this.op](value);
    }
    toString() {
        return `${this.op}${this.node.toString()}`;
    }
}

export class ConditionalOperators implements NodeExpression {

    static Operators = ['?'];

    static parse(tokens: (NodeExpression | string)[]) {
        for (let i = -1; (i = tokens.indexOf('?', i + 1)) > -1;) {
            tokens.splice(i - 1, 2, new ConditionalOperators(tokens[i - 1] as NodeExpression));
        }
    }

    constructor(public condition: NodeExpression) { }
    set(context: object, value: any) {
        throw new Error('ConditionalOperators#set() has no implementation.');
    }
    get(context: object) {
        return this.condition.get(context) || false;
    }
    toString() {
        return `(${this.condition.toString()})?`;
    }
}

export class LiteralUnaryOperators implements NodeExpression {

    static Operators = ['delete', 'typeof', 'void'];
    static RegexOperators = [/^delete|typeof|void\b/.source];

    static parse(tokens: (NodeExpression | string)[], ignore?: string[]) {
        LiteralUnaryOperators.Operators.forEach(op => {
            if (ignore && ignore.includes(op)) {
                return;
            }
            for (let i = -1; (i = tokens.indexOf(op, i + 1)) > -1;) {
                let pre = tokens[i - 1], post = tokens[i + 1];
                if (typeof pre === 'object' && typeof post === 'object') {

                } else if (typeof post === 'object') {
                    tokens.splice(i, 2, new LiteralUnaryOperators(op, post));
                }
            }
        });
    }

    constructor(public op: string, public node: NodeExpression) { }
    toString() {
        return `${this.op} ${this.node.toString()}`;
    }

    set(context: object, value: any) {
        throw new Error('LiteralUnaryOperators#set() has no implementation.');
    }

    get(context: object) {
        switch (this.op) {
            case 'delete': return this.getDelete(context);
            case 'typeof': return this.getTypeof(context);
            case 'void': return this.getVoid(context);
        }
    }

    private getVoid(context: object) {
        return void this.node.get(context);
    }
    private getTypeof(context: object) {
        return typeof this.node.get(context);
    }
    private getDelete(context: object) {
        throw new Error('LiteralUnaryOperators.delete#get() has no implementation.');
        // if (this.node instanceof MemberNode) {
        //     if (this.node.right instanceof ValueNode) {
        //         let parent = this.node.left.get(context);
        //         return Reflect.deleteProperty(parent, this.node.right.get(context) as string | number);
        //     } else {
        //         // loop to get to an end of the chain
        //     }
        // }
        // return Reflect.deleteProperty(context, this.node.get(context));
    }
}

export class FunctionExpression implements NodeExpression {

    constructor(public funcName: NodeExpression, public args: NodeExpression[]) { }

    set(context: object, value: any) {
        throw new Error('FunctionExpression#set() has no implementation.');
    }
    get(context: object) {
        let parameters = this.args.map(param => param.get(context));
        let funCallBack = this.funcName.get(context) as Function;
        let value = funCallBack.call(context, ...parameters);
        return value;
    }
    toString(): string {
        const argsStr = this.args.map(param => param.toString()).join(', ');
        return `${this.funcName.toString()}(${argsStr})`;
    }
}

