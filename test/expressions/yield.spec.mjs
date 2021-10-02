import { JavaScriptParser, ReactiveScope, Stack } from '@ibyar/expressions';

const source = `

function* g1() {
  yield 2;
  yield 3;
  yield 4;
}

function* g2() {
  yield 1;
  yield* g1();
  yield 5;
}

const iterator = g2();

console.log(iterator.next()); // {value: 1, done: false}
console.log(iterator.next()); // {value: 2, done: false}
console.log(iterator.next()); // {value: 3, done: false}
console.log(iterator.next()); // {value: 4, done: false}
console.log(iterator.next()); // {value: 5, done: false}
console.log(iterator.next()); // {value: undefined, done: true}
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


