import { JavaScriptParser } from '@ibyar/expressions';

const source = `

foo = x.y.z;

bar = a[b].c;

zoo = g['name' + h + j][34 + 'age' + uu].qwe[mmm];

zoo = g['name' + h + j]

foo[bar[x + y] + z]
`;




const ast = JavaScriptParser.parse(source);

const events = ast.events();

console.log(JSON.stringify(events));
