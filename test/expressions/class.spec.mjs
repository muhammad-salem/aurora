import { JavaScriptAppParser } from '@ibyar/expressions';

const source = `

class Book {
	static #PRIVATE_STATIC_FIELD;
	name = 'A Song of Ice and Fire';
	#privateField;

	getName() {
		return this.name;
	}
}

// class ClassWithPrivateField {
//   #privateField;
// }

// class ClassWithPrivateMethod {
//   #privateMethod() {
//     return 'hello world';
//   }
// }

// class ClassWithPrivateStaticField {
//   static #PRIVATE_STATIC_FIELD;
// }

// class ClassWithPrivateStaticMethod {
//   static #privateStaticMethod() {
//     return 'hello world';
//   }
// }

`;

const ast = JavaScriptAppParser.parse(source);
console.log(JSON.stringify(ast.toJSON(), undefined, 2));
console.log(ast.toString());
