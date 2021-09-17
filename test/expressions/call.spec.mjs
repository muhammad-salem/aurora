import { JavaScriptParser, ReactiveScope, Stack } from '@ibyar/expressions';

const source = `obj.executeCode?.(35)`;

const ast = JavaScriptParser.parse(source);
const GlobalContext = {
	console,
};

const stack = Stack.for(GlobalContext);
const reactiveScope = ReactiveScope.functionScopeFor({
	obj: {
		executeCode(num) {
			console.log({ num, t: this });
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
