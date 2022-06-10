import { JavaScriptAppParser, Scope, Stack } from '@ibyar/expressions';

const source = `

class Book {
	static #PRIVATE_STATIC_FIELD;
	name = 'A Song of Ice and Fire';
	#privateField;

	getName() {
		return this.name;
	}
}

class ClassWithPrivateField {
  #privateField;
}

class ClassWithPrivateMethod {
  #privateMethod() {
    return 'hello world';
  }
}

class ClassWithPrivateStaticField {
  static #PRIVATE_STATIC_FIELD;
}

class ClassWithPrivateStaticMethod {
  static #privateStaticMethod() {
    return 'hello world';
  }
}

class ClassName {
	name = 'data';
	#privateName = 'private-data';
	method;
	initMethod(){
		this.method = function(){
			this.x = 'XXXX';
			console.log(this.name, this.#privateName, this.x, JSON.stringify(this));
		};
	}
}

let instance = new ClassName;

instance.initMethod();
instance.method();
testInstance(instance);

`;

global.instance = undefined;
function testInstance(instance) {
	console.log(Object.getOwnPropertyNames(instance));
	console.log(Object.getOwnPropertyDescriptor(instance));
	console.log(Object.getOwnPropertyDescriptors(instance));

	console.log(Object.getPrototypeOf(instance));
	console.log(Object.getOwnPropertySymbols(instance));
	console.log(Object.keys(instance));
	console.log(Object.values(instance));
}

const ast = JavaScriptAppParser.parse(source);
console.group('ast');
console.log(JSON.stringify(ast.toJSON(), undefined, 2));
console.groupEnd();
console.group('toString');
console.log(ast.toString());
console.groupEnd();
const stack = new Stack([Scope.for({ console, JSON, testInstance })]);
console.group('run');
ast.get(stack);
console.groupEnd();
