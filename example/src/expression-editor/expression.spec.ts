export const PLAY = `let y = class {i = 9;}
console.log(y);
let x = new y();
console.log(x.i);`;

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