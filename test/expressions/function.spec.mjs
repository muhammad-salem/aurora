import { JavaScriptParser, ReactiveScope, Stack } from '@ibyar/expressions';

const source = `
function logPos({ x, y }) {
	console.log('x = ', x, ', y = ', y);
}
logPos({x: 4, y: 6});

function add(x) {
	console.log('outer x:', x);
	return function (y) {
		console.log('inner x:', x, 'y: ', y);
		return x + y;
	};
}

a = add(10);
b = a(3);
console.log(a, b);

`;

const ast = JavaScriptParser.parse(source);
const GlobalContext = {
	console,
};

const stack = Stack.for(GlobalContext);
const reactiveScope = ReactiveScope.functionScopeFor({

});
reactiveScope.subscribe((p, o, n) => console.log('update', { p, o, n }));
stack.pushScope(reactiveScope);
// execute the code
ast.get(stack);


