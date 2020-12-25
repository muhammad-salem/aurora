# Aurora Teat Package

Test App used to test Aurora while development

#### how to build test app

```bash
git clone https://github.com/aurorats/aurora.git
cd aurora
yarn install
yarn clean && tsc -b -v test/
cd test
esmpack
cd public
# npm i -g serve
serve
```
