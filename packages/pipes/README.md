# Aurora Pipes

Aurora pipes, build-in pipes for aurora lib, like json, translate, async, etc...

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

