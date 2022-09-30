# Ibyar Pipes

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![LICENSE][license-img]][license-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@ibyar/pipes.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url]: https://npmjs.org/package/@ibyar/pipes
[downloads-image]: https://img.shields.io/npm/dt/@ibyar/pipes
[downloads-url]: https://npmjs.org/package/@ibyar/pipes
[license-img]: https://img.shields.io/github/license/ibyar/aurora
[license-url]: https://github.com/ibyar/aurora/blob/master/LICENSE
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/ibyar/aurora

Ibyar pipes, build-in pipes for aurora lib, like json, translate, async, etc...

## `Install`

```bash
npm i --save @ibyar/pipes
```

```bash
yarn add @ibyar/pipes
```

# How to use:

in your html string/file :

```html
<div>{{observable |> async}}</div>
<div>{{text |> lowercase}}</div>
<div>{{obj |> json}}</div>
<pre>{{obj |> json:undefined:2}}</pre>
<div>{{keyValueObject |> keyvalue |> json}}</div>

```

## Built-in Pipes ( Pipeline operator '|>' )

- [x] async
- [ ] date
- [x] lowercase
- [x] titlecase
- [x] uppercase
- [x] json
- [x] keyvalue
- [x] slice
- [ ] currency
- [ ] number
- [ ] percent
- [ ] i18nPlural
- [ ] i18nSelect

