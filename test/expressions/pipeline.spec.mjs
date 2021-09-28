import { JavaScriptParser, ReactiveScope, Stack } from '@ibyar/expressions';

const source = `x |> (z => y = z + 1) |> log`;

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
