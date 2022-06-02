

export default `

class Book {
	static #PRIVATE_STATIC_FIELD = true;
	name = 'A Song of Ice and Fire';
	#privateField = 7;

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