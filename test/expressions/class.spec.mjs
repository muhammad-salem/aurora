import { JavaScriptAppParser } from '@ibyar/expressions';

const source = `

class Book {}

`;

const ast = JavaScriptAppParser.parse(source);
console.log(JSON.stringify(ast.toJSON(), undefined, 2));
console.log(ast.toString());
