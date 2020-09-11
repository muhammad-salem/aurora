import {
    IncrementDecrementOperators, UnaryOperators, ConditionalOperators
} from '../operators/unary.js';
import {
    ArithmeticOperators, ArrayCommaOperators, ArrayOperator,
    AssignmentNode, BitwiseOperators, ComparisonOperators,
    FunctionNode, GroupingOperator, LogicalAssignmentNode, LogicalOperators,
    MemberNode, NavigationNode, ObjectOperator, parseAddSub, parseInfix, RelationalOperators, StatementNode, TernaryNode
} from '../operators/infix.js';
import { NodeExpression, PropertyNode, ValueNode } from '../expression.js';
import { escapeForRegex, generateTokens } from './parser.js';

//dynamically build my parsing regex:
const tokenParser = new RegExp([
    //numbers
    /\d+(?:\.\d*)?|\.\d+/.source,

    //string-literal
    /["](?:\\[\s\S]|[^"])+["]|['](?:\\[\s\S]|[^'])+[']/.source,

    //booleans
    "true|false",

    //operators
    [
        MemberNode.Operators,
        NavigationNode.Operators,
        GroupingOperator.Operators,
        ObjectOperator.Operators,
        ArrayOperator.Operators,
        TernaryNode.Operators,
        FunctionNode.Operators,
        AssignmentNode.Operators,
        LogicalAssignmentNode.Operators,
        ComparisonOperators.Operators,
        ArithmeticOperators.Operators,
        BitwiseOperators.Operators,
        LogicalOperators.Operators,
        RelationalOperators.Operators,
        ArrayCommaOperators.Operators,
        IncrementDecrementOperators.Operators,
        UnaryOperators.Operators,
        ConditionalOperators.Operators,
        StatementNode.Operators
        // DeleteOperators.Operators
    ]
        .flatMap(item => item)
        .filter((value: string, index: number, array: string[]) => {
            return array.indexOf(value) === index;
        })
        .sort((a, b) => b.length - a.length) //so that ">=" is added before "=" and ">"
        .map(escapeForRegex)
        .join('|'),

    //properties
    //has to be after the operators
    /[a-zA-Z$_][a-zA-Z0-9$_]*/.source,

    //remaining (non-whitespace-)chars, just in case
    //has to be at the end
    /\S/.source
].map(s => `(${s})`).join('|'), 'g');

function oneTimeProcess(tokens: (NodeExpression | string)[]): (NodeExpression | string)[] {
    MemberNode.parseDotMember(tokens);
    NavigationNode.parseNavigation(tokens);
    ArrayOperator.parseBrackets(tokens);
    return tokens;
}

const specialCase = ['+', '-'];

function tokenAnlzise(tokens: (string | NodeExpression)[]): NodeExpression {

    MemberNode.parseBracketMember(tokens);

    IncrementDecrementOperators.parse(tokens);
    UnaryOperators.parse(tokens);
    ConditionalOperators.parse(tokens);
    // DeleteOperators.parse(tokens);

    TernaryNode.parse(tokens);

    // parseAddSub(tokens);
    // parseAddSub(tokens);


    parseInfix(ArithmeticOperators, tokens);
    parseInfix(ComparisonOperators, tokens);
    parseInfix(BitwiseOperators, tokens);
    parseInfix(LogicalAssignmentNode, tokens);
    parseInfix(LogicalOperators, tokens);
    parseInfix(RelationalOperators, tokens);
    parseInfix(ArrayCommaOperators, tokens);
    parseInfix(AssignmentNode, tokens);

    return tokens[0] as NodeExpression;
}


export function parseJSExpression(str: string) {
    let tokens: (NodeExpression | string)[] = generateTokens(str, tokenParser);
    oneTimeProcess(tokens);
    GroupingOperator.parse(tokens, tokenAnlzise);
    ObjectOperator.parse(tokens, tokenAnlzise);
    tokenAnlzise(tokens);
    StatementNode.parse(tokens);
    return tokens[0] as NodeExpression;
}