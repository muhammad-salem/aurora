import { NodeExpression, PropertyNode, ValueNode } from '../expression.js';


export function escapeForRegex(str: string): string {
    return String(str).replace(/[.*+?^=!:${}()|[\]\/\\]/g, '\\$&');
}

export function generateTokens(str: string, tokenParser: RegExp): (NodeExpression | string)[] {
    let tokens: (NodeExpression | string)[] = [];
    str.replace(tokenParser, (substring: string, ...args: any[]): string => {
        let token: NodeExpression | string;

        const num: string = args[0];
        const str: string = args[1];
        const bool: string = args[2];
        const op: string = args[3];
        const property: string = args[4];
        // const whitespace: number = args[5];
        // const index: number = args[6];
        // const template: string = args[7];

        // console.log(args);

        if (num) {
            token = new ValueNode(+num);
        } else if (str) {
            token = new ValueNode(str);
        } else if (bool) {
            token = new ValueNode(bool === "true");
        } else if (property) {
            token = new PropertyNode(property);
        }
        else if (!op) {
            throw new Error(`unexpected token '${substring}'`);
        } else {
            token = substring;
        }
        tokens.push(token);
        return substring;
    });
    return tokens;
}