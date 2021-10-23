import { JavaScriptParser, ReactiveScope, Stack } from '@ibyar/expressions';

const source = `

// foo = x.y.z;

// bar = a[b].c;

zoo = g['name' + h + j][34 + 'age' + uu].qwe[mmm];

`;




const ast = JavaScriptParser.parse(source);

const events = ast.events();

console.log(events);

// const GlobalContext = {
// 	console,
// };

// const stack = Stack.for(GlobalContext);
// const reactiveScope = ReactiveScope.functionScopeFor({

// });
// reactiveScope.subscribe((p, o, n) => console.log('update', { p, o, n }));
// stack.pushScope(reactiveScope);
// // execute the code
// ast.get(stack);


