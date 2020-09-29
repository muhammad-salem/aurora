# Aurora Types

aurora types, this project provide a wildcard modules helper to import different non-js files to a typescript project as a module.

With the help of `@aurora/esmpack` can provide some functionality to these modules. 
by replacing the import/export statement itself, with the required code.

`Bindings imported are called live bindings because they are updated by the module that exported the binding.` 
the esmpack will fetch the data, not inject it to the js module. so, while fetching, the object with be `undefined`.

## `Install`

``` bash
npm i --save @aurorats/types
```

``` bash
yarn add @aurorats/types
```

## *Wildcard Structural

```ts
declare module '*.html' {
    export default value;
    export const value: string;
    export const url: string;
    export const promise: Promise<string>;
}
```