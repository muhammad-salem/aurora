# Aurora Example Package

Test App used as example to test Aurora while development

#### how to build test app

```bash
git clone https://github.com/ibyar/aurora.git
cd aurora
yarn install
yarn clean && tsc -b -v example/
cd test
esmpack
cd public
# npm i -g serve
serve
```
