import { JavaScriptParser, ReactiveScope, Stack } from '@ibyar/expressions';

const source = `
const add = (arg1, arg2) => arg1 + arg2;
x
	|> function(s) {return s;}
	|> (z => y = z + 1)
	|> add(?, 2)
	|> add(3, ?)
	|> log:4:5;`;

const ast = JavaScriptParser.parse(source);
const GlobalContext = {
	console,
};

const stack = Stack.for(GlobalContext);
const reactiveScope = ReactiveScope.functionScopeFor({
	log: console.log,
	x: 7,
	y: undefined
});
reactiveScope.subscribe((p, o, n) => console.log('update', { p, o, n }));
stack.pushScope(reactiveScope);
// execute the code
ast.get(stack);
console.log(
	reactiveScope.getContext()
);
