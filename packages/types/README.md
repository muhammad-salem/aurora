# Aurora Types

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![LICENSE][license-img]][license-url]
![npm-dependencies][npm-dep-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@ibyar/types.svg
[npm-url]: https://npmjs.org/package/@ibyar/types
[downloads-image]: https://img.shields.io/npm/dt/@ibyar/types
[downloads-url]: https://npmjs.org/package/@ibyar/types
[license-img]: https://img.shields.io/github/license/ibyar/aurora
[license-url]: https://github.com/ibyar/aurora/blob/master/LICENSE
[npm-dep-url]: https://img.shields.io/david/ibyar/types.svg?maxAge=2592000
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/ibyar/aurora

aurora types, this project provide a wildcard modules helper to import different non-js files to a typescript project as a module.

With the help of `@ibyar/esmpack` can provide some functionality to these modules. 
by replacing the import/export statement itself, with the required code.

`Bindings imported are called live bindings because they are updated by the module that exported the binding.` 
the esmpack will fetch the data, not inject it to the js module. so, while fetching, the object with be `undefined`.

## `Install`

``` bash
npm i --save-dev @ibyar/types
```

``` bash
yarn add @ibyar/types --dev
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
# available modules

- Text: '*.html', '*.css', '*.txt', '*.json'
- Stream: '*.formData', '*.blob', '*.buf', '*.buff', '*.b64', '*.pdf'
- Image: '*.apng', '*.bmp', '*.gif', '*.ico','*.cur','*.jpg', '*.jpeg', '*.jfif', '*.pjpeg', '*.pjp', '*.png', '*.svg', '*.tif', '*.tiff'
- Audio: '*.webp', '*.3gp', '*.flac', '*.mpg', '*.mpeg', '*.mp3'
- Video: '*.mp4', '*.m4a', '*.oga', '*.ogg', '*.wav', '*.webm'

# How to use: 

in your main index.ts file insert: 

```ts
/// <reference types="@ibyar/types" />

import bootstrap from 'bootstrap/dist/css/bootstrap.min.css';

```
