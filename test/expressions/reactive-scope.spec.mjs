import { JavaScriptParser, ReactiveScope, Stack } from '@ibyar/expressions';

const source = `
	console.log('#1', text, user, first?.['second']?.last);
	text += ' ' + user.name;
	user.age++;
	first.second.last += ' ## ';
	first['second'].last += 'element 2';
	console.log('#2', text, user, first.second?.last);
	console.log('#3 throw type error exception', first.dummy.property);
	`;

const ast = JavaScriptParser.parse(source);
const GlobalContext = {
	console,
};
const stack = Stack.for(GlobalContext);
const reactiveScope = ReactiveScope.functionScopeFor({
	text: 'hello',
	user: {
		name: 'jon',
		age: 20,
	},
	first: {
		second: {
			last: 'element 1'
		}
	}
});
reactiveScope.subscribe((p, o, n) => console.log('update', { p, o, n }));
stack.pushScope(reactiveScope);
// execute the code
ast.get(stack);
console.log(
	reactiveScope.getContext()
);
