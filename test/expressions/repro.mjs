// repro.mjs
import { JavaScriptParser, Stack } from '@ibyar/expressions';

const run = (src, ctx = {}) => JavaScriptParser.parse(src).get(Stack.for(ctx));

console.log(run('true ? "yes" : "no"'));
console.log(run('x > 1 ? "big" : "small"', { x: 5 }));
console.log(JSON.stringify(JavaScriptParser.parse('true ? "yes" : "no"').toJSON().body[0]));

for (const expr of ['(a ?? 1) + 1', '(true ? 1 : 2) + 1']) {
  try {
    console.log(expr, '=>', run(expr, { a: null }));
  } catch (err) {
    console.log(expr, '=>', `${err.name}: ${err.message}`);
  }
}
