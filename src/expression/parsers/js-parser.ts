import {
    IncrementDecrementOperators, UnaryOperators,
    ConditionalOperators, LiteralUnaryOperators
} from '../operators/unary.js';
import {
    ArithmeticOperators, ArrayCommaOperators, ArrayOperator,
    AssignmentNode, BitwiseOperators, ComparisonOperators,
    FunctionNode, GroupingOperator, LogicalAssignmentNode,
    LogicalOperators, MemberNode, NavigationNode, ObjectOperator,
    parseInfix, PipelineOperator, RelationalOperators, StatementNode,
    TernaryNode
} from '../operators/infix.js';
import { NodeExpression } from '../expression.js';
import { generateTokenParser, generateTokens } from './parser.js';
import { AliasedOperator, DeclareVariableOperator, OfItemsOperator } from '../statement/for-expr.js';


const tokenParser = generateTokenParser(
    [
        MemberNode.Operators,
        NavigationNode.Operators,
        GroupingOperator.Operators,
        ObjectOperator.Operators,
        ArrayOperator.Operators,
        TernaryNode.Operators,
        FunctionNode.Operators,
        PipelineOperator.Operators,
        AssignmentNode.Operators,
        LogicalAssignmentNode.Operators,
        ComparisonOperators.Operators,
        ArithmeticOperators.Operators,
        BitwiseOperators.Operators,
        LogicalOperators.Operators,
        ArrayCommaOperators.Operators,
        IncrementDecrementOperators.Operators,
        UnaryOperators.Operators,
        ConditionalOperators.Operators,
        StatementNode.Operators,
    ],
    [
        ...RelationalOperators.RegexOperator,
        ...LiteralUnaryOperators.RegexOperators
    ]
);

function oneTimeProcess(tokens: (NodeExpression | string)[]): (NodeExpression | string)[] {
    MemberNode.parseDotMember(tokens);
    NavigationNode.parseNavigation(tokens);
    ArrayOperator.parseBrackets(tokens);
    return tokens;
}

function tokenAnalysis(tokens: (string | NodeExpression)[]): NodeExpression {

    MemberNode.parseBracketMember(tokens);

    IncrementDecrementOperators.parse(tokens);
    UnaryOperators.parse(tokens);
    ConditionalOperators.parse(tokens);
    LiteralUnaryOperators.parse(tokens);
    parseInfix(PipelineOperator, tokens);

    TernaryNode.parse(tokens);

    parseInfix(ArithmeticOperators, tokens);
    parseInfix(ComparisonOperators, tokens);
    parseInfix(BitwiseOperators, tokens);
    parseInfix(LogicalAssignmentNode, tokens);
    parseInfix(LogicalOperators, tokens);
    parseInfix(RelationalOperators, tokens);
    parseInfix(ArrayCommaOperators, tokens);
    parseInfix(AssignmentNode, tokens);

    DeclareVariableOperator.parser(tokens);
    AliasedOperator.parser(tokens);
    OfItemsOperator.parser(tokens);

    // if (tokens.length > 1) {
    //     throw new Error(`expression should be with length 1, tokens = ${tokens}`);
    // }
    return tokens[0] as NodeExpression;
}

export function parseTokens(tokens: (NodeExpression | string)[]) {
    oneTimeProcess(tokens);
    GroupingOperator.parse(tokens, tokenAnalysis);
    ObjectOperator.parse(tokens);
    tokenAnalysis(tokens);
    StatementNode.parse(tokens);
    return tokens;
}

export function parseJSExpressionByRegex(str: string, regex: RegExp) {
    let tokens: (NodeExpression | string)[] = generateTokens(str, regex);
    return parseTokens(tokens);
}

export function parseJSExpression(str: string) {
    let tokens = parseJSExpressionByRegex(str, tokenParser);
    if (tokens.length > 1) {
        throw new Error(`expression should be with length 1, exp = ${str}`);
    }
    return tokens[0] as NodeExpression;
}
