# Ibyar Directives

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![LICENSE][license-img]][license-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@ibyar/directives.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url]: https://npmjs.org/package/@ibyar/directives
[downloads-image]: https://img.shields.io/npm/dt/@ibyar/directives
[downloads-url]: https://npmjs.org/package/@ibyar/directives
[license-img]: https://img.shields.io/github/license/ibyar/aurora
[license-url]: https://github.com/ibyar/aurora/blob/master/LICENSE
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/ibyar/aurora

Ibyar directive had the built-in directives for aurora project.

## `Install`

``` bash
npm i --save @ibyar/directives
```

``` bash
yarn add @ibyar/directives
```


## Supported Directive

#### Structure Directives
- [x] *if
- [x] *for is same as ( *forOf )
- [x] *forIn
- [x] *forAwait		
- [x] *switch and (*case, *default)


#### Attributes Directives
- [x] *class
- [x] *style


## How to use Structure Directives:

```html
<div *if="x > 50"> x: is {{x}} </div>

<div *if="x > 50; else otherTemplate"> x: is {{x}} </div>
<template #otherTemplate> X is more than 50</template>

<div *if="x > 50; then thenTemplate; else elseTemplate"> will be ignored </div>
<template #thenTemplate> x: is {{x}}</template>
<template #elseTemplate> X is less than 50</template>


<div class="col-3" *forOf="let user of people">
	<p>Name: <span>{{user.name}}</span></p>
	<p>Age: <span>{{user.age}}</span></p>
</div>
<div class="col-3" *for="let user of people">
	<p>Name: <span>{{user.name}}</span></p>
	<p>Age: <span>{{user.age}}</span></p>
</div>

<div class="col-3" *forOf let-user  [of]="people">
	<p>Name: <span>{{user.name}}</span></p>
	<p>Age: <span>{{user.age}}</span></p>
</div>

<div class="col-3" *forIn="let key in person1">
	<p>Key: <span>{{key}}</span></p>
	<p>Value: <span>{{person1[key]}}</span></p>
</div>

<div class="col-3" *forIn let-key [in]="person1">
	<p>Key: <span>{{key}}</span></p>
	<p>Value: <span>{{person1[key]}}</span></p>
</div>

<div class="col-3" *forAwait="let num of asyncIterable">
	<p>num = <span>{{num}}</span></p>
</div>

<div class="col-3" *forAwait let-num [of]="asyncIterable">
	<p>num = <span>{{num}}</span></p>
</div>

<div class="col-3" *switch="1">
	<div *case="1">One</div>
	<div *case="2">Two</div>
	<div *case="3">Three</div>
	<div *default>default: Zero</div>
</div>

```

## How to use Attributes Directives:

```html
<div class="row">
	<div [class]="$propertyFromModel"></div>
	<div class="col-{{width}}"></div>
	<div [class]="'col-6'"></div>
	<div [class]="['col-4', $textColor_fromModel, 'text-center']"></div>
</div>
...
<tr [class]="{'table-info': isEven, 'table-danger': isOdd}">
	...
</tr>


<div [style]="'color: var(' + currentColor + ');'">...</div>
<div [style]="`color: var(${currentColor});`">...</div>
<div [style]="{color: 'var(' + currentColor + ')'}">...</div>
<div [style.color]="'var(' + currentColor + ')'"><div>

```


 -- `Directives now support input binding (one way/two way/ output=event)`


## Structural directive syntax reference

When you write your own structural directives, use the following syntax:

```
*:prefix="( :let | :expression ) (';' | ',')? ( :let | :as | :keyExp )*"
```

The following tables describe each portion of the structural directive grammar:

<table>

  <tr>
    <td><code>prefix</code></td>
    <td>HTML attribute key</td>
  </tr>
  <tr>
    <td><code>key</code></td>
    <td>HTML attribute key</td>
  </tr>
  <tr>
    <td><code>local</code></td>
    <td>local variable name used in the template</td>
  </tr>
  <tr>
    <td><code>export</code></td>
    <td>value exported by the directive under a given name</td>
  </tr>
  <tr>
    <td><code>expression</code></td>
    <td>standard Aurora expression</td>
  </tr>
</table>

<table>
  <tr>
    <th></th>
  </tr>
  <tr>
    <td colspan="3"><code>keyExp = :key ":"? :expression ("as" :local)? ";"? </code></td>
  </tr>
  <tr>
    <td colspan="3"><code>let = "let" | "const" | "var" :local "=" :export ";"?</code></td>
  </tr>
  <tr>
    <td colspan="3"><code>as = :export "as" :local ";"?</code></td>
  </tr>
</table>

### How Aurora translates shorthand

Lke Angular translates structural directive shorthand into the normal binding syntax as follows:

<table>
  <tr>
    <th>Shorthand</th>
    <th>Translation</th>
  </tr>
  <tr>
    <td><code>key</code> and naked <code>expression</code></td>
    <td><code>[key]="expression"</code>
    <br />
    Notice that the <code>prefix</code>
    is <code>not</code> added to the <code>key</code>
    </td>
  </tr>
  <tr>
    <td><code>let</code></td>
    <td><code>[export]="local"</code></td>
  </tr>
</table>

### Shorthand examples

The following table provides shorthand examples:

<table>
  <tr>
    <th>Shorthand</th>
    <th>How Aurora interprets the syntax</th>
  </tr>
  <tr>
    <td><code>*for="let item of [1,2,3]"</code></td>
    <td><code>&lt;template *for [item]="$implicit [of]="[1,2,3]"&gt;</code></td>
  </tr>
  <tr>
    <td><code>*forOf="let item of [1,2,3] as items; trackBy: myTrack; index as i"</code></td>
    <td><code>&lt;template *forOf [item]="$implicit" [of]="[1,2,3]" [items]="of" [trackBy]="myTrack" [i]="index"&gt;</code>
    </td>
  </tr>
  <tr>
    <td><code>*if="exp"</code></td>
    <td><code>&lt;template [if]="exp"&gt;</code></td>
  </tr>
  <tr>
    <td><code>*if="exp as value"</code></td>
    <td><code>&lt;template [if]="exp" [value]="if"&gt;</code></td>
  </tr>
</table>

<hr>
