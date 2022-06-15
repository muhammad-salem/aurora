
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
  publicField;
}

class ClassWithPublicMethod {
  publicMethod () { }
}

class ClassWithPrivateField {
  #privateField;
}

class ClassWithPrivateMethod {
  #privateMethod() {
    return 'hello world';
  }
}

class ClassWithPublicStaticField {
  static PUBLIC_STATIC_FIELD;
}

class ClassWithPublicStaticMethod {
  static publicStaticMethod() {};
}

class ClassWithPrivateStaticField {
  static #PRIVATE_STATIC_FIELD;
}

class ClassWithPrivateStaticMethod {
  static #privateStaticMethod() {
    return 'hello world';
  }
}

`;