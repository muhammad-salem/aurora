import { JavaScriptParser, ReactiveScope, Stack } from '@ibyar/expressions';

// parse JS code
const ast = JavaScriptParser.parse(`
	const x = 'Hello';
	const y = "World";
	
	let z = x + ' ' + y + '!';
	z = 123 + 456;
	z = (x + ' ' + y).toUpperCase();
	z = 'Reactive Scope is Awesome!!';

`);

// create reactive scope, can listen to changes of variables
const reactiveScope = ReactiveScope.blockScope();


// listen for changes of 'z' variable
const zSubscription = reactiveScope.subscribe('z', (nz, oz) => {
	console.log('new value of Z = ' + nz, 'old value of Z = ' + oz);
});

// listen for changes of 'z' const
const xSubscription = reactiveScope.subscribe('x', (nx, ox) => {
	console.log('new value of X = ' + nx, 'old value of X = ' + ox);
});

// create stack
const stack = new Stack(reactiveScope);

// execute js code
ast.get(stack);

// unsubscribe from all created ScopeSubscription
zSubscription.unsubscribe();
xSubscription.unsubscribe();
