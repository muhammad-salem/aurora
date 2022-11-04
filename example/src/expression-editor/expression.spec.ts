export const MODULE_A = `
export const user = {
	name: 'alex',
	age: 25
};
export const app = {
	name: 'aurora',
	lang: ['ts', 'js', 'html', 'css'],
};
export default 'defaultName';
`;


export const IMPORT_ALL = `
import * as foo from 'moduleA';
console.log('foo', foo);
`;
export const IMPORT_DEFAULT = `
import defaultName from 'moduleA';
console.log('user', user);
`;
export const IMPORT_NAMED = `
import {user, app} from 'moduleA';
console.log('user', user);
console.log('app', app);
`;
export const IMPORT_NAMED_ALIAS = `
import {default as defaultName, user as bar} from 'moduleA';
console.log('user', bar);
console.log('name', defaultName);
`;

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
