import { JavaScriptParser, Stack } from '@ibyar/expressions';

const source = `
	let { x, y } = {x: 5, y: 99};
	console.log(x, y);
	`;
const ast = JavaScriptParser.parse(source);
console.log(JSON.stringify(ast, void 0, 2));
const context = {
	Promise,
	setTimeout,
	console,
	Symbol
};
const stack = Stack.for(context);
ast.get(stack);
console.log(context.x, context.y);
