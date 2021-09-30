import { JavaScriptParser, Scope, Stack } from '@ibyar/expressions';

const source = `
	let { x, y } = {x: 5, y: 55};
	const z = x / y;
	console.log({x, y, z});
	const alex = { firstName: 'alex', lastName: 'jon', age: 30 };
	alex.fullName = function(){ return this.firstName + ' ' + this.lastName;};
	console.log(alex.fullName());
	console.log(alex.fullName.toString());
	setTimeout(() => console.log('setTimeout', alex), 500);
	const sara = { firstName: 'sara', lastName: 'jon', age: 28, [Symbol.toStringTag]: 'SARA'};
	console.log(sara['age']);
	console.log('toStringTag', Object.prototype.toString.call(sara));
	console.log('compare', sara.age <=> alex.age);
	console.log('older', sara.age >? alex.age);
	console.log('younger', sara.age <? alex.age);
	console.log('typeof', typeof alex);
	console.log('typeof', typeof alex.age);
	console.log('regex 1', /regex/g.test('reg'));
	console.log('regex 2', /regex/g.test('regex'));
	`
	+
	'let stringLiteralExample = `${alex.firstName} and ${sara.firstName} are friends`; console.log({stringLiteralExample});'
	+
	`
	function latex(str) {
		return { "cooked": str[0], "raw": str.raw[0] }
	}
	`
	+
	'let taggedStringLiteral = latex`Hi\n${2+3}!`; console.log({taggedStringLiteral});'
	;

const ast = JavaScriptParser.parse(source);
const esTree = ast.toJSON();
const esTreeString = JSON.stringify(ast, void 0, 2);
console.log({ esTree, esTreeString });
const context = {
	Promise,
	setTimeout,
	console,
	Symbol,
	Object
};
const stack = Stack.for(context);
const globalScope = Scope.functionScope();
stack.pushScope(globalScope);
ast.get(stack);
console.log(
	'from global context values: x: %s, y: %s',
	globalScope.getContext().x,
	globalScope.getContext().y
);
console.log(
	globalScope.getContext()
);
