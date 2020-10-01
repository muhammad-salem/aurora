import { NodeExpression, PropertyNode, ValueNode } from '../expression.js';
import { ConditionalOperators, FunctionExpression, UnaryOperators } from './unary.js';

export class MemberNode implements NodeExpression {

    static Operators = [
        /**
         * dot
         */
        '.',
        /**
         * bracket notation
         */
        '[]'
    ];

    static parseDotMember(tokens: (NodeExpression | string)[]) {
        for (let i = 1; (i = tokens.indexOf('.', i - 1)) > -1;) {
            tokens.splice(i - 1, 3, new MemberNode('.', tokens[i - 1] as NodeExpression, tokens[i + 1] as NodeExpression));
        }
    }
    static parseBracketMember(tokens: (NodeExpression | string)[]) {
        for (let i = tokens.length - 1; i > 0; i--) {
            const node = tokens[i];
            if (node instanceof ArrayOperator && node.nodes.length === 1) {
                const pre = tokens[i - 1];
                if (pre instanceof MemberNode) {
                    let member = new MemberNode('[]', pre, node.nodes[0]);
                    tokens.splice(i - 1, 2, member);
                    --i;
                }
            }
        }
    }

    constructor(public op: string, public left: NodeExpression, public right: NodeExpression) { }
    set(context: object, value: any) {
        if (this.op === '.') {
            return this.right.set(this.left.get(context), value);
        } else {
            return this.left.get(context)[this.right.get(context)] = value;
        }
    }
    get(context: object) {
        if (this.op === '.') {
            return this.right.get(this.left.get(context));
        } else {
            return this.left.get(context)[this.right.get(context)];
        }
    }
    toString() {
        let str: string;
        if (this.op === '.') {
            str = `${this.left.toString()}.${this.right.toString()}`;
        } else {
            str = `${this.left.toString()}[${this.right.toString()}]`;
        }
        return str;
    }
}

export class NavigationNode implements NodeExpression {

    static Operators = ['?.'];

    static parseNavigation(tokens: (NodeExpression | string)[]) {
        for (let i = 1; (i = tokens.indexOf('?.', i - 1)) > -1;) {
            tokens.splice(i - 1, 3, new NavigationNode(tokens[i - 1] as NodeExpression, tokens[i + 1] as NodeExpression));
        }
    }

    constructor(public left: NodeExpression, public right: NodeExpression) { }
    set(context: object, value: any) {
        this.right.set(this.left.get(context), value);
    }
    get(context: object) {
        return this.right.get(this.left.get(context));
    }
    toString() {
        return `${this.left.toString()}?.${this.right.toString()}`;
    }
}

export type TokenReducer = (tokens: (string | NodeExpression)[]) => NodeExpression[];
export type TokenAnalysis = (tokens: (string | NodeExpression)[]) => NodeExpression;


export class GroupingOperator implements NodeExpression {

    static Operators = ['(', ')'];

    static parse(tokens: (NodeExpression | string)[], tokenAnalysis: TokenAnalysis) {

        for (var i, j; (i = tokens.lastIndexOf('(')) > -1 && (j = tokens.indexOf(')', i)) > -1;) {
            let groupTokens = tokens.slice(i + 1, j);
            let funcName = tokens[i - 1];
            if (/** groupTokens.includes(',') && */typeof funcName === 'object') {
                // is function call

                let last = 0;
                let commaIndex = groupTokens.indexOf(',', last);
                let args: NodeExpression[] = [];
                while (commaIndex > last) {
                    args.push(tokenAnalysis(groupTokens.slice(last, commaIndex)));
                    last = commaIndex + 1;
                    commaIndex = groupTokens.indexOf(',', last);
                }
                if (commaIndex === -1) {
                    commaIndex = groupTokens.length;
                    let param = tokenAnalysis(groupTokens.slice(last, commaIndex));
                    if (param) {
                        args.push(param);
                    }
                }
                let func = new FunctionExpression(funcName, args);
                tokens.splice(i - 1, j + 2 - i, func);
            } else {
                let group = new GroupingOperator(tokenAnalysis(groupTokens));
                tokens.splice(i, j + 1 - i, group);
            }
        }

        for (let i = 1; (i = tokens.indexOf('?.', i - 1)) > -1;) {
            tokens.splice(i - 1, 3, new NavigationNode(tokens[i - 1] as NodeExpression, tokens[i + 1] as NodeExpression));
        }

        for (let index = tokens.length - 1; index >= 0; index--) {
            let current = tokens[index];
            if (current instanceof GroupingOperator) {
                let pre = tokens[index - 1];
                if (typeof pre === 'object') {
                    let func = new FunctionExpression(pre, [current.node]);
                    tokens.splice(index - 1, 2, func);
                }
            }
        }
    }

    constructor(public node: NodeExpression) { }
    set(context: object, value: any) {
        return this.node.set(context, value);
    }
    get(context: object) {
        return this.node.get(context);
    }
    toString() {
        return `(${this.node.toString()})`;
    }
}

export class ObjectOperator implements NodeExpression {

    static Operators = ['{', '}'];
    static parseComma(tokens: (NodeExpression | string)[], objectNode: ObjectOperator) {
        for (let i = 1; (i = tokens.indexOf(',', i - 1)) > -1;) {
            let pre = tokens[i - 1], post = tokens[i + 1];
            if (typeof pre === 'object' && typeof post === 'object') {
                if (pre instanceof PropertyNode) {
                    objectNode.addProperty(pre.property, post);
                } else if (pre instanceof ValueNode) {
                    objectNode.addProperty(pre.value as string, pre);
                } else {
                    continue;
                }
                tokens.splice(i - 1, 3);
            }
        }
    }
    static parse(tokens: (NodeExpression | string)[]) {

        for (var i, j; (i = tokens.lastIndexOf('{')) > -1 && (j = tokens.indexOf('}', i)) > -1;) {
            let newToken = tokens.slice(i + 1, j);
            let obj = new ObjectOperator();
            if (newToken.includes(':')) {
                TernaryNode.parse(newToken, obj);
            } else if (newToken.includes(',')) {
                this.parseComma(newToken, obj);
            } else {
                continue;
            }
            tokens.splice(i, j + 1 - i, obj);
        }
    }

    public props: { [keyof: string]: NodeExpression } = {};

    private model: { [key: string]: any };
    private proxy: any;

    constructor() {
        this.model = {};
        this.proxy = new Proxy(this.model, {
            deleteProperty: (target: { [key: string]: any }, p: PropertyKey): boolean => {
                return this.removeProperty(p as string);
            }
        });
    }

    set(context: object, value: any) {
        throw new Error(`ObjectOperator#set() has no implementation.`);
    }
    get(context: object) {
        Object.keys(this.props).forEach(key => {
            this.model[key] = this.props[key].get(context);
        });
        return this.proxy;
    }
    toString() {
        return `[${Object.keys(this.props)
            .map(key => `"${key}":${this.props[key].toString()}`)
            .join(', ')}]`;
    }

    addProperty(propertyName: string | number, propertyNode: NodeExpression) {
        this.props[propertyName] = propertyNode;
    }

    removeProperty(propertyName: string): boolean {
        return Reflect.deleteProperty(this.props, propertyName)
            && Reflect.deleteProperty(this.model, propertyName);
    }
}

export class ArrayOperator implements NodeExpression {

    static Operators = ['[', ']'];

    static parseBrackets(tokens: (NodeExpression | string)[]) {

        for (let i, j; (i = tokens.lastIndexOf('[')) > -1 && (j = tokens.indexOf(']', i)) > -1;) {
            const nodes: NodeExpression[] = [];

            for (let index = i + 1; index < j; index++) {
                const node = tokens[index];
                if (node === ',') {
                    continue;
                } else if (typeof node === 'string') {
                    throw new Error('error at Parsing Brackets op,');
                } else {
                    nodes.push(node);
                }
            }
            const arr = new ArrayOperator(nodes);
            tokens.splice(i, j + 1 - i, arr);
        }

        for (let index = tokens.length - 1; index >= 0; index--) {
            let current = tokens[index];
            if (current instanceof ArrayOperator && current.nodes.length === 1) {
                let pre = tokens[index - 1];
                if (typeof pre === 'object') {
                    let member = new MemberNode('[]', pre, current.nodes[0]);
                    tokens.splice(index - 1, 2, member);
                }
            }
        }
    }

    constructor(public nodes: NodeExpression[]) { }
    set(context: object, value: any) {
        throw new Error(`ArrayOperator#set() has no implementation.`);
    }
    get(context: object) {
        return this.nodes.map(node => node.get(context));
    }
    toString() {
        return `[${this.nodes.map(node => node.toString()).join(', ')}]`;
    }
}

export class TernaryNode implements NodeExpression {

    static Operators = [':'];

    static parse(tokens: (NodeExpression | string)[], objectNode?: ObjectOperator) {
        for (let i = 1; (i = tokens.indexOf(':', i - 1)) > -1;) {
            let pre = tokens[i - 1], post = tokens[i + 1];
            let conditional = tokens[i - 2];
            function createTernaryNode() {
                let ternary = new TernaryNode(conditional as ConditionalOperators, pre as NodeExpression, post as NodeExpression);
                tokens.splice(i - 2, 4, ternary);
            }
            if (conditional instanceof ConditionalOperators) {
                createTernaryNode();
            } else if (conditional instanceof GroupingOperator && conditional.node instanceof ConditionalOperators) {
                createTernaryNode();
            } else if (objectNode && typeof pre === 'object' && typeof post === 'object') {
                if (pre instanceof PropertyNode) {
                    objectNode.addProperty(pre.property, post);
                } else if (pre instanceof ValueNode) {
                    objectNode.addProperty(pre.value as string, post);
                }
                tokens.splice(i - 1, 3);
            } else {
                throw new Error(`didn't found any ConditionalOperators`);
            }
        }
    }

    constructor(public conditional: ConditionalOperators | GroupingOperator, public left: NodeExpression, public right: NodeExpression) { }
    set(context: object, value: any) {
        throw new Error(`TernaryNode#set() has no implementation.`);
    }
    get(context: object) {
        return this.conditional.get(context) ? this.right.get(context) : this.left.get(context);
    }
    toString() {
        return `${this.conditional.toString()} (${this.left.toString()}):(${this.right.toString()})`;
    }
}

export class FunctionNode implements NodeExpression {

    static Operators = ['(', ')'];

    constructor(public func: NodeExpression, public params: NodeExpression[]) { }
    set(context: object, value: any) {
        throw new Error(`TernaryNode#set() has no implementation.`);
    }
    get(context: object) {
        let funCallBack = this.func.get(context) as Function;
        let value = funCallBack.call(context, ...this.params.map(param => param.get(context)));
        return value;
    }
    toString(): string {
        return `${this.func.toString()}(${this.params.map(param => param.toString()).join(', ')})`;
    }
}

export class StatementNode implements NodeExpression {

    static Operators = [';', '\n'];

    static parse(tokens: (NodeExpression | string)[]) {
        if (tokens.includes(';') || tokens.includes('\n')) {
            let statements = tokens
                .filter(node => typeof node === 'object') as NodeExpression[];
            let statementNode = new StatementNode(statements);
            tokens.splice(0, tokens.length, statementNode);
        }
    }

    constructor(public nodes: NodeExpression[]) { }
    set(context: object, value: any) {
        throw new Error(`StatementNode#set() has no implementation.`);
    }
    get(context: object) {
        let value;
        this.nodes.forEach(node => value = node.get(context));
        return value;
    }
    toString(): string {
        return this.nodes.map(node => node.toString()).join('; ');
    }
}

export interface EvaluateNode {
    left: any, right: any;
}

export type EvaluateCallback = (evalNode: EvaluateNode) => any;

export interface Evaluate {
    [key: string]: EvaluateCallback;
}

export abstract class InfixOperators implements NodeExpression {
    constructor(public op: string, public left: NodeExpression, public right: NodeExpression, public callback: EvaluateCallback) { }
    get(context: object): boolean {
        const evalNode: EvaluateNode = {
            left: this.left.get(context),
            right: this.right.get(context)
        };
        return this.callback(evalNode);
    }
    toString() {
        return `${this.left.toString()} ${this.op} ${this.right.toString()}`;
    }
    set(context: object, value: any) {
        throw new Error(`${this.constructor.name}#set() has no implementation.`);
    }
}

export class AssignmentNode implements NodeExpression {

    static Evaluations: Evaluate = {

        '=': (evalNode: EvaluateNode) => { return evalNode.left = evalNode.right; },

        '+=': (evalNode: EvaluateNode) => { return evalNode.left += evalNode.right; },
        '-=': (evalNode: EvaluateNode) => { return evalNode.left -= evalNode.right; },
        '*=': (evalNode: EvaluateNode) => { return evalNode.left *= evalNode.right; },
        '/=': (evalNode: EvaluateNode) => { return evalNode.left /= evalNode.right; },

        '%=': (evalNode: EvaluateNode) => { return evalNode.left %= evalNode.right; },
        '**=': (evalNode: EvaluateNode) => { return evalNode.left **= evalNode.right; },

        '<<=': (evalNode: EvaluateNode) => { return evalNode.left <<= evalNode.right; },
        '>>=': (evalNode: EvaluateNode) => { return evalNode.left >>= evalNode.right; },
        '>>>=': (evalNode: EvaluateNode) => { return evalNode.left >>>= evalNode.right; },


        '&=': (evalNode: EvaluateNode) => { return evalNode.left &= evalNode.right; },
        '^=': (evalNode: EvaluateNode) => { return evalNode.left ^= evalNode.right; },
        '|=': (evalNode: EvaluateNode) => { return evalNode.left |= evalNode.right; },

    };

    static Operators = Object.keys(AssignmentNode.Evaluations);

    constructor(public op: string, public left: NodeExpression, public right: NodeExpression) {
        if (!(AssignmentNode.Operators.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation`);
        }
    }
    set(context: object, value: any) {
        return this.left.set(context, value);
    }
    get(context: object) {
        const evalNode: EvaluateNode = {
            left: this.left.get(context),
            right: this.right.get(context)
        };
        const value = AssignmentNode.Evaluations[this.op](evalNode);
        this.set(context, value);
        return value;
    }
    toString() {
        return `${this.left.toString()} ${this.op} ${this.right.toString()}`;
    }
}

export class LogicalAssignmentNode implements NodeExpression {

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

    static Operators = ['&&=', '||=', '??='];

    constructor(public op: string, public left: NodeExpression, public right: NodeExpression) {
        if (!(LogicalAssignmentNode.Operators.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation`);
        }
    }
    set(context: object, value: any) {
        return this.left.set(context, value);
    }
    get(context: object) {
        return LogicalAssignmentNode.Evaluations[this.op](this, context);
    }
    toString() {
        return `${this.left.toString()} ${this.op} ${this.right.toString()}`;
    }
}


export class ComparisonOperators extends InfixOperators {

    static Evaluations: Evaluate = {

        '==': (evalNode: EvaluateNode) => { return evalNode.left == evalNode.right; },
        '===': (evalNode: EvaluateNode) => { return evalNode.left === evalNode.right; },
        '!=': (evalNode: EvaluateNode) => { return evalNode.left != evalNode.right; },
        '!===': (evalNode: EvaluateNode) => { return evalNode.left !== evalNode.right; },

        '>': (evalNode: EvaluateNode) => { return evalNode.left > evalNode.right; },
        '>=': (evalNode: EvaluateNode) => { return evalNode.left >= evalNode.right; },

        '<': (evalNode: EvaluateNode) => { return evalNode.left < evalNode.right; },
        '<=': (evalNode: EvaluateNode) => { return evalNode.left <= evalNode.right; }

    };

    static Operators = Object.keys(ComparisonOperators.Evaluations);

    constructor(op: string, left: NodeExpression, right: NodeExpression) {
        if (!(ComparisonOperators.Operators.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation`);
        }
        super(op, left, right, ComparisonOperators.Evaluations[op]);
    }
}

export class ArithmeticOperators extends InfixOperators {

    static Evaluations: Evaluate = {

        '+': (evalNode: EvaluateNode) => { return evalNode.left + evalNode.right; },
        '-': (evalNode: EvaluateNode) => { return evalNode.left - evalNode.right; },
        '*': (evalNode: EvaluateNode) => { return evalNode.left * evalNode.right; },
        '/': (evalNode: EvaluateNode) => { return evalNode.left / evalNode.right; },

        '%': (evalNode: EvaluateNode) => { return evalNode.left % evalNode.right; },
        '**': (evalNode: EvaluateNode) => { return evalNode.left ** evalNode.right; },
    };

    static Operators = Object.keys(ArithmeticOperators.Evaluations);

    constructor(op: string, left: NodeExpression, right: NodeExpression) {
        if (!(ArithmeticOperators.Operators.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation yet`);
        }
        super(op, left, right, ArithmeticOperators.Evaluations[op]);
    }
}

export class BitwiseOperators extends InfixOperators {

    static Evaluations: Evaluate = {

        '&': (evalNode: EvaluateNode) => { return evalNode.left & evalNode.right; },
        '|': (evalNode: EvaluateNode) => { return evalNode.left | evalNode.right; },
        '^': (evalNode: EvaluateNode) => { return evalNode.left ^ evalNode.right; },

        '<<': (evalNode: EvaluateNode) => { return evalNode.left << evalNode.right; },
        '>>': (evalNode: EvaluateNode) => { return evalNode.left >> evalNode.right; },
        '>>>': (evalNode: EvaluateNode) => { return evalNode.left >>> evalNode.right; },
    };

    static Operators = Object.keys(BitwiseOperators.Evaluations);

    constructor(op: string, left: NodeExpression, right: NodeExpression) {
        if (!(BitwiseOperators.Operators.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation.`);
        }
        super(op, left, right, BitwiseOperators.Evaluations[op]);
    }
}

export class LogicalOperators extends InfixOperators {

    static Evaluations: Evaluate = {
        /**
         * Logical AND (&&)
         */
        '&&': (evalNode: EvaluateNode) => { return evalNode.left && evalNode.right; },
        /**
         * Logical OR (||)
         */
        '||': (evalNode: EvaluateNode) => { return evalNode.left || evalNode.right; },
        /**
         *  Nullish coalescing operator (??)
         */
        '??': (evalNode: EvaluateNode) => { return evalNode.left ?? evalNode.right; }
    };

    static Operators = Object.keys(LogicalOperators.Evaluations);

    constructor(op: string, left: NodeExpression, right: NodeExpression) {
        if (!(LogicalOperators.Operators.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation.`);
        }
        super(op, left, right, LogicalOperators.Evaluations[op]);
    }
}

export class RelationalOperators extends InfixOperators {

    static Evaluations: Evaluate = {
        'in': (evalNode: EvaluateNode) => { return evalNode.left in evalNode.right; },
        'instanceof': (evalNode: EvaluateNode) => { return evalNode.left instanceof evalNode.right; }
    };

    static Operators = Object.keys(RelationalOperators.Evaluations);
    static RegexOperator = [/^in\b|instanceof\b/g.source];

    constructor(op: string, left: NodeExpression, right: NodeExpression) {
        if (!(RelationalOperators.Operators.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation.`);
        }
        super(op, left, right, RelationalOperators.Evaluations[op]);
    }
}

export class ArrayCommaOperators extends InfixOperators {

    static Evaluations: Evaluate = {
        /**
         * [1,2,3,4]
         * {name, age, data} 
         *  while context had {"name": "alex", "age": 33, .. etc}
         */
        ',': (evalNode: EvaluateNode) => { return evalNode.left, evalNode.right; },
    };

    // static parse(tokens: (NodeExpression | string)[]) {
    //     for (let i = 1; (i = tokens.indexOf(',', i - 1)) > -1;) {
    //         let pre = tokens[i - 1], post = tokens[i + 1];

    //     }
    // }

    static Operators = Object.keys(ArrayCommaOperators.Evaluations);

    constructor(op: string, left: NodeExpression, right: NodeExpression) {
        if (!(ArrayCommaOperators.Operators.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation.`);
        }
        super(op, left, right, ArrayCommaOperators.Evaluations[op]);
    }
}

export class PipelineOperator implements NodeExpression {

    static Operators = ['|>'];

    constructor(public op: string, public param: NodeExpression, public func: NodeExpression) { }
    set(context: object, value: any) {
        throw new Error(`TernaryNode#set() has no implementation.`);
    }
    get(context: object) {
        let funCallBack = this.func.get(context) as Function;
        let value = funCallBack.call(context, this.param.get(context));
        return value;
    }
    toString(): string {
        return `(${this.param.toString()}) |> (${this.func.toString()})`;
    }
}

export interface OpConstructable<T = any> {
    new(...params: any[]): T;
}

export type Parser = OpConstructable & { Operators: string[] };

export function parseInfixOperator(parserClass: Parser, tokens: (NodeExpression | string)[], op: string) {
    for (let i = 1; (i = tokens.indexOf(op, i - 1)) > -1;) {
        let pre = tokens[i - 1], post = tokens[i + 1];
        if (typeof pre === 'object' && typeof post === 'object') {
            tokens.splice(i - 1, 3, new parserClass(op, pre, post));
        }
    }
}

export function parseInfix(parserClass: Parser, tokens: (NodeExpression | string)[], ignore?: string[]) {
    parserClass.Operators.forEach(op => {
        if (ignore && ignore.includes(op)) {
            return;
        }
        parseInfixOperator(parserClass, tokens, op);
    });
}

export function parseInfixOnly(parserClass: Parser, tokens: (NodeExpression | string)[], operators: string[]) {
    operators.forEach(op => {
        parseInfixOperator(parserClass, tokens, op);
    });
}

export function parseAddSub(tokens: (NodeExpression | string)[]) {
    ['+', '-'].forEach(op => {
        // console.log(tokens);
        for (let i = -1; (i = tokens.indexOf(op, i + 1)) > -1;) {
            let pre = tokens[i - 1], post = tokens[i + 1];
            if (typeof pre === 'object' && typeof post === 'object') {
                tokens.splice(i - 1, 3, new ArithmeticOperators(op, pre, post));
            } else if (typeof post === 'object') {
                tokens.splice(i, 2, new UnaryOperators(op, post));
            }
        }
    });
}

/**
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators#Assignment
 * TO:DO
 * let [a,b] = [3, 6];
 */
export class DestructuringAssignment {

}