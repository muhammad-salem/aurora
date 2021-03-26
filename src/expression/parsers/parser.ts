import {
	FalseNode, NodeExpression, NullNode,
	PropertyNode, TrueNode, UndefinedNode, ValueNode
} from '../expression.js';


export function escapeForRegex(str: string): string {
	return String(str).replace(/[.*+?^=!:${}()|[\]\/\\]/g, '\\$&');
}

const NULL = String(null);
const TRUE = String(true);
// const UNDEFINED = String(undefined);

export function generateTokens(str: string, tokenParser: RegExp): (NodeExpression | string)[] {
	let tokens: (NodeExpression | string)[] = [];
	str.replace(tokenParser, (substring: string, ...args: any[]): string => {
		let token: NodeExpression | string;

		const num: string = args[0];
		const str: string = args[1];
		const bool: string = args[2];
		const nullish: string = args[3];
		const op: string = args[4];
		const property: string = args[5];
		// const whitespace: number = args[6];
		// const index: number = args[7];
		// const template: string = args[8];

		// console.log(args);

		if (num) {
			token = new ValueNode(+num);
		} else if (str) {
			token = new ValueNode(str);
		} else if (bool) {
			if (TRUE === bool) {
				token = TrueNode;
			} else {
				token = FalseNode;
			}
		} else if (nullish) {
			if (NULL === nullish) {
				token = NullNode;
			} else {
				token = UndefinedNode;
			}
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

export function generateTokenParser(operators: string[][], concatRegex: string[]): RegExp {


	//dynamically build js parsing regex:
	const pattern = [
		//numbers,                          index 0
		/\d+(?:\.\d*)?|\.\d+/.source,

		//string-literal                    index 1
		/["](?:\\[\s\S]|[^"])+["]|['](?:\\[\s\S]|[^'])+[']/.source,

		//booleans                          index 2
		"true|false",

		//primitive values                  index 3
		"null|undefined",

		//operators                         index 4
		operators
			.flatMap(item => item)
			.filter((value: string, index: number, array: string[]) => {
				return array.indexOf(value) === index;
			})
			.sort((a, b) => b.length - a.length) //so that ">=" is added before "=" and ">"
			.map(escapeForRegex)
			.concat(concatRegex || [])
			.join('|'),

		//properties                        index 5
		//has to be after the operators
		/[a-zA-Z$_ɵ][a-zA-Z0-9$_]*/.source,

		//remaining (non-whitespace-)chars, just in case
		//has to be at the end              index 6
		/\S/.source
	].map(s => `(${s})`).join('|');

	return new RegExp(pattern, 'g');
}
