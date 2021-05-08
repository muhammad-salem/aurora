# Aurora Directives

Aurora directive had the built-in directives for aurora project.

## `Install`

``` bash
npm i --save @ibyar/directives
```

``` bash
yarn add @ibyar/directives
```


## Supported Directive

- [x] *if
- [x] *for
- [x] *for in
- [x] *for of
- [x] *for await
- [x] *while
- [x] *switch
- [ ] *class
- [ ] *style


# How to use:

```html
<div *if="x > 50"> x: is {{x}} </div>

<div class="col-3" *for="const i = 0; i < people.length; i++">
	<p>Name: <span>{{people[i].name}}</span></p>
	<p>Age: <span>{{people[i].age}}</span></p>
</div>


<div class="col-3" *for="let user of people">
	<p>Name: <span>{{user.name}}</span></p>
	<p>Age: <span>{{user.age}}</span></p>
</div>

<div class="col-3" *for="let key in person1">
	<p>Key: <span>{{key}}</span></p>
	<p>Value: <span>{{person1[key]}}</span></p>
</div>

<div class="col-3" *for="await (let num of asyncIterable)">
	<p>num = <span>{{num}}</span></p>
</div>

<div class="col-3" *while="i < people.length">
	<p>Name: <span>{{people[i].name}}</span></p>
	<p>Age: <span>{{people[i++].age}}</span></p>
</div>

<div class="col-3" *while="let index = 0; index < people.length">
	<p>Name: <span>{{people[index].name}}</span></p>
	<p>Age: <span>{{people[index++].age}}</span></p>
</div>

<div class="col-3" *switch="1">
	<div *case="1">One</div>
	<div *case="2">Two</div>
	<div *case="3">Three</div>
	<div *default>default: Zero</div>
</div>

```
