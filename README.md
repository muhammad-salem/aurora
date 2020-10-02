# Aurora

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![LICENSE][license-img]][license-url]
![npm-dependencies][npm-dep-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@aurorats/core.svg
[npm-url]: https://npmjs.org/package/@aurorats/core
[downloads-image]: https://img.shields.io/npm/dt/@aurorats/core
[downloads-url]: https://npmjs.org/package/@aurorats/core
[license-img]: https://img.shields.io/github/license/aurorats/aurora
[license-url]: https://github.com/aurorats/aurora/blob/master/LICENSE
[npm-dep-url]: https://img.shields.io/david/aurorats/aurora.svg?maxAge=2592000
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/aurorats/aurora

Aurora is a web framework, that can create and define a Web Component standards ('custom elements', 'Shadow DOM' and 'HTML Templates'), that compatible with other frameworks, using Typescript.
 - Template can be a JSX template or  HTML template.

```text
Render Once, Update Properties On Change.
No need for Virtual Dom.
```

## `Install`

``` bash
npm i --save @aurorats/core
```

``` bash
yarn add @aurorats/core
```

in your `tsconfig.json` add 

```json
{
    "extends": "@aurorats/core/tsconfig.compilerOption.json",
}
```

in your `index.ts` file add type reference for `@aurorats/types`

```ts
/// <reference types="@aurorats/types" />
```

see test for more help [test](https://github.com/aurorats/aurora/tree/master/test)

## 'HTML Template' and 'JSX' Features

| Support | HTML Template| JSX |
| -------------------- | - | - |
| Parsing Attributes | ✓ | ✓ |
| One Way Data Binding | ✓ | ✓ |
| Two Way Data Binding | ✓ | ✓ |
| Event Binding | ✓ | ✓ |
| Template Parser | ✓ | ✓ |
| Template Syntax | ✓ | ✓ |
| Template Reference Variables | ✓ | ✓ |
| Template HTML File | fetch | no need |
| JSX Factory | no need | ✓ |
| Fragment | ✓ | ✓ |
| camelCase Property Naming | ✓ | ✓ |
| lowercase for root element Property Naming | ✓ | ✓ |

## Library Features

| Features | Aurora |
| ------- | ------- |
| ES Module | ✓ |
| JavaScript | TO:DO |
| Dependency Injection |  TO:DO |
| Component| ✓ |
| Directives | ✓ |
| Pipes | TO:DO |
| Services | TO:DO |
| Lifecycle | ✓ |
| @Input | ✓ |
| @Output | ✓ |
| @View | ✓ |
| @HostListener | ✓ |
| @ViewChild | ✓ |
| @HostBinding | TO:DO |
| @ViewChildren | TO:DO |
| @SelfSkip | TO:DO |
| @Optional | TO:DO |
| *if Directive | ✓ |
| *for Directive | TO:DO |
| *switch Directive | TO:DO |
| [Annotation/Decorators reflect-metadata][metadata] | ✓ |
| XSS (cross-site-scripting) | TO:DO |

[metadata]: https://github.com/rbuckton/reflect-metadata

## Web Component standards

| Standards  | Support |
| ------- | ------- |
| [Custom Elements][custom]  | ✓ |
| [Shadow DOM][shadow] | ✓ |
| [HTML Templates Element][template]| ✓ |
| [HTML Templates Element with Shadow DOM][template]| ✓ |

## Custom Elements standards

| Features | Aurora |
| ------- | ------- |
| [Reflecting Properties to Attributes][attr-props] | ✓ |
| [Observing Changes to Attributes][observ-attr] | ✓ |
| [Element Upgrades][elem-upgrd] | ✓ |
| [Styling a Custom Element][style] | TO:DO |
| [Extending native HTML elements][extend-native] | ✓ |
| [Extending a Custom Element][extend-custom] | TO:DO |
| [Two Component On Same Model Class][two-component] | ✓ |
| [Two Component Share Same Model Instance][two-component] | TO:DO |

## Shadow DOM standards

| Features | Aurora |
| ------- | ------- |
| [Open Mode][shadow-mode-open] | ✓ |
| [Closed Mode][shadow-mode-closed] | ✓ |
| [delegatesFocus][shadow-focus] | ✓ |
| [Shadow DOM event model][shadow-event] | ✓ |

## HTML Templates Element standards

| Features | Aurora |
| ------- | ------- |
| [Load template by ID from document][template-id] | ✓ |
| As Normal Custom Element | ✓ |
| As Shadow DOM Element | ✓ |


[attr-props]: https://developers.google.com/web/fundamentals/web-components/customelements#reflectattr
[observ-attr]: https://developers.google.com/web/fundamentals/web-components/customelements#attrchanges
[elem-upgrd]: https://developers.google.com/web/fundamentals/web-components/customelements#upgrades
[custom]: https://developers.google.com/web/fundamentals/web-components/customelements
[shadow]: https://developers.google.com/web/fundamentals/web-components/customelements#shadowdom
[template]: https://developers.google.com/web/fundamentals/web-components/customelements#fromtemplate
[style]: https://developers.google.com/web/fundamentals/web-components/customelements#styling
[extend-custom]: https://developers.google.com/web/fundamentals/web-components/customelements#extendcustomeel
[extend-native]: https://developers.google.com/web/fundamentals/web-components/customelements#extendhtml
[shadow-mode-open]:https://developers.google.com/web/fundamentals/web-components/shadowdom#elements
[shadow-mode-closed]: https://developers.google.com/web/fundamentals/web-components/shadowdom#closed
[shadow-focus]: https://developers.google.com/web/fundamentals/web-components/shadowdom#focus
[shadow-event]: https://developers.google.com/web/fundamentals/web-components/shadowdom#events
[template-id]: https://developers.google.com/web/fundamentals/web-components/customelements#fromtemplate
[two-component]:https://github.com/salemebo/aurora-ts/blob/master/test/multi-component/m-person.tsx


### `[JSX and HTML] -- template parser example`

```tsx

export interface DataModel {
    name: string;
    version: number;
    description: {
        title: string;
        desc: string;
    };
}

@Component({
    selector: 'app-view',
    template: ({viewData}: AppView) => {
        return (
            <Fragment>
                {/* just pass data as text, jsx feature*/}
                <h1>{viewData.name}</h1>
                {/* just pass data as text, from prop viewData.name to innerHTML */}
                <h1 innerHTML="$viewData.name"></h1>
                {/* one way binding for 'innerHTML' to property 'viewData.name' */}
                <h1 $innerHTML="viewData.name"></h1>
                {/* two way binding for 'innerHTML' to property 'viewData.name' */}
                <input type="text" $value="$viewData.name"></h1>

                <h2 $innerHTML="viewData.version"></h2>
                <div class="card">
                    <div class="card-header" $innerHTML="viewData.description.title"></div>
                    <div class="card-body" $innerHTML="viewData.description.desc" ></div>
                </div>
            </Fragment>
        );
    }
})
export class AppView {
    @Input()
    viewData: DataModel;
}

@Component({
    selector: 'app-edit',
    template:
        `
        <form #form >
            <div class="mb-3" >
                <label for="appName" class="form-label">Name</label>
                <input id="appName" type="text" [(value)]="editData.name"/>
            </div>
            <div class="mb-3" >
                <label for="appversin" class="form-label" > Version </label>
                <input id="appversin" type="number" [(value)]="editData.version"/>
            </div>

            <div class="mb-3" >
                <label for="title" class="form-label" >Title</label>
                <input id="title" type="text" [(value)]="editData.description.title"/>
            </div>

            <div class="mb-3" >
                <label for="desc" class="form-label">Description</label>
                <input id="desc" type="text" [(value)]="editData.description.desc"/>
            </div>
            <div class="btn-group" role="group" aria-label="Basic example" >
                <button type="button" class="btn btn-primary" (click)="printModel()">Print</button>
                <button type="button" class="btn btn-secondary" (click)="saveModel()">Save</button>
            </div>
        </form>
        `
})
export class AppEdit {
    @Input()
    editData: DataModel;

    @Output()
    save = new EventEmitter<DataModel>();

    @View()
    view: HTMLComponent<HTMLEdit> | HTMLElement;

    printModel() {
        console.log(this.editData);
    }

    saveModel() {
        this.save.emit(this.editData);
    }
}

@Component({
    selector: 'root-app',
    encapsulation: 'custom',
    template:
        `
        <div class="row" >
            <div class="col-6" >
                <app-edit [(editData)]="model" (save)="saveAction($event)" />
            </div>
            <div class="col-6" >
                <app-view [viewData]="model" />
            </div>
        </div>
        `
})
export class RootApp implements OnInit {

    model: DataModel;

    onInit(): void {
        this.model = {
            name: 'Aurora',
            version: 2,
            description: {
                title: 'Aurora custom element creator',
                desc: `Aurora is a web framework, that can create and define a usable 'custom elements',
                that compatible with other frameworks, using Typescript`
            }
        };
    }

    saveAction(data: any) {
        console.log('tag: rootApp', data);
    }

}
```

in index.html add:

```html
    <body>
        <root-app></root-app>
        <script type="module" src="path-to-main-file/index.js"></script>
    </body>
```

#### how to build

```bash
git clone https://github.com/aurorats/aurora.git
cd aurora
yarn install
yarn build
```
