import type { Type } from '../utils/typeof.js';
import type { DomNode } from '@ibyar/elements';
import type { TemplateUrl } from '../utils/path.js';
import type { ZoneType } from '../zone/bootstrap.js';
import type { ValueControl } from '../component/custom-element.js';


export interface DirectiveOptions {

	/**
	 * the name of the directive which is used in the template
	 * 
	 * a structural directive name should start with `*`,
	 * and an attributes directive should not.
	 */
	selector: string;

	/**
	 * export this directive to the HTML template scope,
	 * 
	 * it can be accessed by the template reference name 
	 * ex:
	 * ```ts
	 * 
	 * 
	 * 
	 * Directive({
	 * 	selector: '*tooltip',
	 * 	exportAs: 'tooltip'
	 * })
	 * ```
	 * 
	 * in your component
	 * 
	 * ```html
	 * <a tooltip="I'm a tooltip!!" #tooltip="tooltip">I'm a link</a>
	 * <button (click)="tooltip.toggleTooltip()">Toggle tooltip</button>
	 * ```
	 * 
	 */

	exportAs?: string;

	/**
	 * - use `manual` for no zone.js patch effect applied,
	 *  and used for manual change detection for heavily process components.
	 * 
	 * - use `proxy` zone for automatic detect changes without use of `zone.js`
	 * 
	 * - use `aurora` for detection events like `rxjs` observables, `setTimeout`,
	 *  `setInterval` and `fetch` and `XMLHttpRequest`, etc...
	 * make sure that `zone.js` is imported in the polyfills module. 
	 * 
	 * if no value specified, the value will be initialized by the custom element `web component` zone,
	 *  - if the web component zone is `manual`, the directive zone also will be `manual`, expect weird behavior.
	 *  - if the web component zone is `proxy`, the directive zone also will be `proxy`.
	 *  - if the web component zone is `aurora`, the directive zone also will be `aurora` and will get the benefit of `zone.js`.
	 */
	zone?: ZoneType;

	/**
	 * name of possible structure directives successor
	 */
	successors?: string[];

}

export interface InjectableOptions {
	provideIn?: Type<CustomElementConstructor> | 'root' | 'platform' | 'any';
}

export interface PipeOptions {
	name: string;
	asynchronous?: boolean;
}

export interface ComponentOptions<T = Type<any>> {

	/**
	 * a tag name for the component,
	 * if the tag name is valid custom element name, the view class will be a custom element,
	 * otherwise an HTMLUnknownElement will be created
	 */
	selector: string;

	/**
	 * add html file url path to fetch,
	 * templateUrl had propriety than template, and will override it.
	 *
	 * Can provide file name as "person-view.html" will resolved 
	 * as 'http://site-address.org/persin-view.html',
	 * 
	 * OR as an object { moduleMeta: import.meta, filename: 'person-edit.html' }
	 *  let (import.meta = '/person/person.js') will resolved 
	 * as 'http://site-address.org/person/person-edit.html',
	 * 
	 * OR as an object { moduleMeta: import.meta }
	 * let (import.meta = '/person/person.js') will resolved as 'http://site-address.org/person/person.html'.
	 * 
	 * if url not found, component will not be defined,
	 * 
	 * if you didn't use webpack or rollup.js or any bundler, 
	 * you should copy the html files to its folder by yourself. 
	 */
	templateUrl?: TemplateUrl | string;

	/**
	 * template: html string
	 * 	if template === null || undefined ==> it had nothing to render, 
	 * and may be inherit from an html element
	 * 
	 * write a template, as inline string, represent a a valid html.
	 * 				
	 */
	template?: string | DomNode;

	/**
	 * style for this element
	 */
	styles?: string | { [key: string]: string }[];

	/**
	 * what basic element should the new component inherit from,
	 * the tag name to inherit from as 'a', 'div', 'table', 'td', 'th', 'tr', etc ...
	 * also, support extends a custom element tag name.
	 */
	extend?: keyof HTMLElementTagNameMap | `${string}-${string}`;

	/**
	 * An encapsulation policy for the template and CSS styles. One of:
	 *  'custom': Use global CSS without any encapsulation.
	 *  'shadow-dom': Use Shadow DOM v1 to encapsulate styles.
	 * 
	 *  'template': like 'custom', with load the template from the document ('index.html' file)
	 * 	 			that had the same id as the component "selector".
	 *  'shadow-dom-template': like 'shadowDom', and load template by selector id.
	 * 
	 * Both 'template' & 'shadow-dom-template' encapsulation type:
	 *  should had attributes name like lowercase,
	 * 	the browser itself, will convert all attributes to lowercase
	 * 
	 * ```typescript
	 * 		personAge = input<number>(20, {alias: 'personage'});
	 * 		propName = input<string>(undefined, {alias: 'propname'});
	 *		saveButtonClick = output<Persons>({alias: 'savebuttonclick'});
	 *		readonly view = view(HTMLFormElement);
	 * ```
	 * 
	 * any app root element as 
	 * 
	 * ```html
	 * <app-root></app-root>
	 * ```
	 * 
	 * the supported bind options is 'One way binding *(as passing data only)'
	 *  and 'template parsing' and 'event binding' syntax, HTML (angular) like.
	 * it load its attributes from 'window object'
	 * 
	 * so to pass date to A root element, 
	 * 
	 * ```html
	 * <script>
	 * 	const appVersion = '0.1.504';
	 * 	function onRootAppClick() {
	 *		console.log('root app clicked');
	 * 	}
	 * 	function onSave(data){
	 *		console.log('root app save', data);
	 * 	}
	 * </script>
	 * <app-root [version]="appVersion" 
	 * 		onclick="onRootAppClick()"
	 * 		(save)="onSave()" >
	 * </app-root>
	 * ```
	 * 
	 * default is 'custom'
	 * @type {'custom' | 'shadowDom' | 'template' | 'shadowDom-template'}
	 */
	encapsulation?: 'custom' | 'shadow-dom' | 'template' | 'shadow-dom-template';

	/**
	 * default: 'open' when encapsulation used,
	 * otherwise it is undefined and will not attach shadow root element.
	 */
	shadowDomMode?: ShadowRootMode;

	/**
	 * default: false
	 */
	shadowDomDelegatesFocus?: boolean;

	/**
	 * shadow root initialization options,
	 * default mode: `open`, delegatesFocus: `false` and slotAssignment: `manual`
	 */
	shadowRootInit?: Partial<ShadowRootInit>;

	/**
	 * 
	 */
	disabledFeatures?: ('internals' | 'shadow')[];

	/**
	 * Create a custom form-associated element with HTMLElement.attachInternals
	 * default: false
	 * 
	 * if the value is `true` it is expected from the model class to implement `ValueControl<T>` interface
	 * 
	 * otherwise you can register another class that implement `ValueControl<T>`,
	 * in case if you want split the model and the value controller.
	 * 
	 * #### Usage Notes:
	 * 
	 * ```ts
	 * 
	 * @Component({
	 * 	selector: 'custom-message',
	 * 	template: `
	 * 		<label for="message">Message</label>
	 * 		<textarea id="message" [(value)]="message" [disabled]="disabled" (change)="onMessageChange($event.target.value)"></textarea>
	 * 	`,
	 * 	formAssociated: true,
	 * 	// formAssociated: CustomMessage,
	 * })
	 * export class CustomMessage implements ValueControl<string> {
	 * 
	 * 	private message: string | null = '';
	 * 	private disabled: boolean = false;
	 * 	private _onChange: (_: any) => void = () => {};
	 * 
	 * 	writeValue({ value, mode }: WriteValueOptions<string>) {
	 * 		this.message = mode !== 'reset' ? value : '';
	 * 	}
	 * 
	 * 	registerOnChange(fn: (_: any) => void): void {
	 * 		this._onChange = fn;
	 * 	}
	 * 
	 * 	setDisabledState(isDisabled: boolean) {
	 * 		this.disabled = isDisabled;
	 * 	}
	 * 
	 * 	onMessageChange(message: string) {
	 * 		this._onChange(message);
	 * 	}
	 * 	
	 * }
	 * 
	 * 
	 * export class CustomInputValueControl implements ValueControl<number> {
	 * 
	 * 	private _value: number | null = null;
	 * 	private _disabled: boolean = false;
	 * 	private _onChange: (_: any) => void = () => {};
	 * 
	 * 	writeValue({ value, mode }: WriteValueOptions<number>) {
	 * 		this._value = mode !== 'reset' ? value : null;
	 * 	}
	 * 
	 * 	registerOnChange(fn: (_: any) => void): void {
	 * 		this._onChange = fn;
	 * 	}
	 * 
	 * 	setDisabledState(isDisabled: boolean) {
	 * 		this._disabled = isDisabled;
	 * 	}
	 * 	
	 * }
	 * 
	 * @Component({
	 * 	selector: 'custom-input',
	 * 	extend: 'input',
	 * 	formAssociated: CustomInputValueControl,
	 * })
	 * export class CustomInputElement {
	 * 	
	 * 	view = view<HTMLInputElement>();
	 * 
	 * 	onInit() {
	 * 		this.view.type = 'number';
	 * 	}
	 * }
	 * 
	 * ```
	 */
	formAssociated?: boolean | Type<ValueControl<any>>;

	/**
	 * - use `manual` for no zone.js patch effect applied,
	 *  and used for manual change detection for heavily process components.
	 * `better to use with signals`.
	 * 
	 * - use `proxy` zone for automatic detect changes without use of `zone.js`
	 * 
	 * - use `aurora` for detection events like `rxjs` observables, `setTimeout`,
	 *  `setInterval` and `fetch` and `XMLHttpRequest`, etc...
	 * make sure that `zone.js` is imported in the polyfills module. 
	 * 
	 * the default value is the platform zone type which can be changed by:
	 * 
	 * ```js
	 * bootstrapZone('manual')
	 * bootstrapZone('proxy')
	 * bootstrapZone('aurora')
	 * ```
	 * 
	 * if `bootstrapZone` never been called, then the default zone is a `manual`.
	 */
	zone?: ZoneType;

	/**
	 * The imports property specifies the component's template dependencies — those directives, components, and pipes that can be used within its template.
	 */
	imports?: (Type<any> | ReadonlyArray<any>)[];
}

export interface ChildOptions {
	[key: string]: any;
}

export interface ViewChildOpt {
	selector: string | typeof HTMLElement | CustomElementConstructor;
	childOptions?: ChildOptions;
}

export type OutputEventInit = Omit<EventInit, 'cancelable'>;
export type OutputOptions = { name?: string } & OutputEventInit;


export interface ModuleOptions {
	/**
 * The imports property specifies the component's template dependencies — those directives, components, and pipes that can be used within its template.
 */
	imports?: (Type<any> | ReadonlyArray<any>)[];

}
