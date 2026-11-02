import { JavaScriptParser } from '@ibyar/expressions';

const source = `

using name1 = value1;
using name1 = value1, name2 = value2;
using name1 = value1, name2 = value2, /* …, */ nameN = valueN;

await using name1 = value1;
await using name1 = value1, name2 = value2;
await using name1 = value1, name2 = value2, /* …, */ nameN = valueN;

const resources = [new Resource(), new Resource(), new Resource()];
for (using resource of resources) {
  console.log(resource.getValue());
  // resource disposed here
}

function example() {
  const resource = new Resource();
  return () => {
    using resource2 = resource;
    return resource2.getValue();
  };
}

using resource = new Resource();
export { resource };

using resource1 = new Resource(),
  resource2 = new Resource();

// OR

using resource1 = new Resource();
using resource2 = new Resource();

function acquireResource() {
  // Imagine some real-world relevant condition here,
  // such as whether there's space to allocate for this resource
  if (Math.random() < 0.5) {
    return null;
  }
  return new Resource();
}

{
  using _ = new Lock();
  // Perform concurrent operations here
  // Lock disposed (released) here
}


class CantDisposeMe {
  #name;
  constructor(name) {
    this.#name = name;
  }
  [Symbol.dispose]() {
    throw new Error(\`Can't dispose \${this.#name}\`);
  }
}

let error;

try {
	using resource1 = new CantDisposeMe("resource1");
	using resource2 = new CantDisposeMe("resource2");
	throw new Error("Error in main block");
} catch (e) {
	error = e;
}


`;

const ast = JavaScriptParser.parse(source);

console.log(ast);
