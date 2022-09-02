
export const IMPORT_ALL = `import * as foo from 'mod';`;
export const IMPORT_DEFAULT = `import defaultName from 'mod';`;
export const IMPORT_NAMED = `import {foo, bar} from 'mod';`;
export const IMPORT_NAMED_ALIAS = `import {default as defaultName, foo as bar} from 'mod';`;

export const PLAY = `
let Y = class YY {
	static FF = 10;
	i = 9;
	#j = 'hello';
	getJ(){ 
		return this.#j + ' world ' + this.constructor.FF;
	}
};

let y = new Y();
console.log(y.i, y.getJ());
`;

export const CLASS_EXAMPLE = `
class ClassWithPublicField {
	publicField = 9;
}
console.log(new ClassWithPublicField().publicField);


class ClassWithPublicMethod {
	publicMethod() { return 8; }
}
console.log(new ClassWithPublicMethod().publicMethod());


class ClassWithPrivateField {
	#privateField = 99;

	getPrivate() {
		return this.#privateField;
	}
}
console.log(new ClassWithPrivateField().getPrivate());

class ClassWithPrivateMethod {
	#privateMethod() {
		return 'hello world';
	}

	getPrivate() {
		return this.#privateMethod();
	}
}

console.log(new ClassWithPrivateMethod().getPrivate());

class ClassWithPublicStaticField {
	static PUBLIC_STATIC_FIELD = 77;
}

console.log(ClassWithPublicStaticField.PUBLIC_STATIC_FIELD);


class ClassWithPublicStaticMethod {
	static publicStaticMethod() { return 88; };
}

console.log(ClassWithPublicStaticMethod.publicStaticMethod());


class ClassWithPrivateStaticField {
	static #PRIVATE_STATIC_FIELD = 55;

	static getPrivate() {
		return this.#PRIVATE_STATIC_FIELD;
	}
}

console.log(ClassWithPrivateStaticField.getPrivate());

class ClassWithPrivateStaticMethod {
	static #privateStaticMethod() {
		return 'hello world';
	}

	static getPrivate() {
		return this.#privateStaticMethod();
	}
}
console.log(ClassWithPrivateStaticMethod.getPrivate());


`;
