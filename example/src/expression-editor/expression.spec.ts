

export default `

class ClassWithPublicField {
  publicField;
}

class ClassWithPublicStaticField {
  static PUBLIC_STATIC_FIELD;
}

class ClassWithPublicMethod {
  publicMethod () {

  }
}

class ClassWithPublicStaticMethod {
  static publicStaticMethod() {};
}

class ClassWithPrivateField {
  #privateField;
}

class ClassWithPrivateStaticField {
  static #PRIVATE_STATIC_FIELD;
}

// class ClassWithPrivateMethod {
//   #privateMethod() {
//     return 'hello world';
//   }
// }

// class ClassWithPrivateStaticMethod {
//   static #privateStaticMethod() {
//     return 'hello world';
//   }
// }

`;