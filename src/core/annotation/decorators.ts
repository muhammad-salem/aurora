import type { TypeOf } from '../utils/typeof.js';
import { DomNode } from '@ibyar/elements';
import { Components } from '../component/component.js';
import { ReflectComponents } from '../component/reflect.js';
import { fetchHtml, TemplateUrl } from '../utils/path.js';
import { ZoneType } from '../zone/bootstrap.js';
import { ValueControl } from '../component/custom-element.js';


export interface DirectiveOptions {

	/**
	 * the name of the directive which is used in the template
	 * 
	 * a structural directive name should start with `*`,
	 * and an attributes directive should not.
	 */
	selector: string;

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
}

export interface ServiceOptions {
	provideIn?: TypeOf<CustomElementConstructor> | 'root' | 'platform' | 'any';
}

export interface PipeOptions {
	name: string;
	asynchronous?: boolean;
}

export interface ComponentOptions<T = Function> {
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
	 * template: typeof 'string' ==> html string,
	 * 			 TypeOf 'DomRootRenderNode<T>' ==> JSX, create factory
	 * 	if template === null || undefined ==> it had nothing to render, 
	 * and may be inherit from an html element
	 * 
	 * 2 possible way to write a template, as inline string, represent a a valid html, 
	 * or us aurora jsx factory 
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
	 */
	extend?: keyof HTMLElementTagNameMap;

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
	 *		@Input('personage') personAge: number;
	 *		@Input('propname') propName: string;
	 *		@Output('savebuttonclick') saveButtonClick = new EventEmitter<Persons>();
	 *		@View('personform') personForm: HTMLFormElement;
	 * ```
	 * 
	 * any root element as 
	 * 
	 * ```html
	 * <root-app></root-app>
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
	 * 	let appVersion = '0.1.504';
	 * 	function onRootAppClick() {
	 *		console.log('root app clicked');
	 * 	}
	 * 	function onSave(data){
	 *		console.log('root app save', data);
	 * 	}
	 * </script>
	 * <root-app [version]="appVersion" 
	 * 		onclick="onRootAppClick()"
	 * 		(save)="onSave()" ></root-app>
	 * ```
	 * 
	 * default is 'custom'
	 * @type {'custom' | 'shadowDom' | 'template' | 'shadowDom-template'}
	 */
	encapsulation?: 'custom' | 'shadow-dom' | 'template' | 'shadow-dom-template';

	/**
	 * default: 'open'
	 */
	shadowDomMode?: ShadowRootMode;

	/**
	 * default: false
	 */
	shadowDomDelegatesFocus?: boolean;

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
	 * 	@View()
	 * 	view: HTMLInputElement;
	 * 
	 * 	onInit() {
	 * 		this.view.type = 'number';
	 * 	}
	 * }
	 * 
	 * ```
	 */
	formAssociated?: boolean | TypeOf<ValueControl<any>>;

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
}

export interface ChildOptions {
	[key: string]: any;
}

export interface ViewChildOpt {
	selector: string | typeof HTMLElement | CustomElementConstructor;
	childOptions?: ChildOptions;
}

export function Input(name?: string): Function {
	return (target: Object, propertyKey: string) => {
		ReflectComponents.addInput(target, propertyKey, name || propertyKey);
	};
}

export function FormValue(): Function {
	return (target: Object, propertyKey: string) => {
		ReflectComponents.addInput(target, propertyKey, 'value');
	};
}

export type OutputEventInit = Omit<EventInit, 'cancelable'>;
export type OutputOptions = { name?: string } & OutputEventInit;

export function Output(options?: OutputOptions): Function;
export function Output(name?: string, options?: OutputEventInit): Function;
export function Output(name?: string | OutputOptions, options?: OutputEventInit): Function {
	const eventType = typeof name === 'object' ? name.name : name;
	const eventOpts = typeof name === 'object' ? name : options;
	return (target: Object, propertyKey: string) => {
		ReflectComponents.addOutput(
			target,
			propertyKey, eventType || propertyKey,
			{
				bubbles: eventOpts?.bubbles ?? false,
				composed: eventOpts?.composed ?? false
			}
		);
	};
}

export function View(): Function {
	return (target: Object, propertyKey: string) => {
		ReflectComponents.setComponentView(target, propertyKey);
	};
}

export function ViewChild(selector: string | typeof HTMLElement | CustomElementConstructor,
	childOptions?: ChildOptions): Function {
	return (target: Object, propertyKey: string) => {
		ReflectComponents.addViewChild(target, propertyKey, selector, childOptions);
	};
}

export function ViewChildren(selector: string | typeof HTMLElement | CustomElementConstructor): Function {
	return (target: Object, propertyKey: string) => {
		ReflectComponents.addViewChildren(target, propertyKey, selector);
	};
}

export function HostListener(eventName: string, args?: string | string[]): Function {
	return (target: Object, propertyKey: string) => {
		args = typeof args === 'string' ? [args] : args;
		ReflectComponents.addHostListener(
			target,
			propertyKey,
			eventName,
			args || []
		);
	};
}

export function HostBinding(hostPropertyName: string): Function {
	return (target: Object, propertyKey: string) => {
		ReflectComponents.addHostBinding(target, propertyKey, hostPropertyName);
	};
}

export function Pipe(opt: PipeOptions): Function {
	return (target: Function) => {
		Components.definePipe(target, opt);
		return target;
	};
}

export function Service(opt: ServiceOptions): Function {
	return (target: Function) => {
		Components.defineService(target, opt);
		return target;
	};
}
export function Directive(opt: DirectiveOptions): Function {
	return (target: Function) => {
		Components.defineDirective(target, opt);
		return target;
	};
}

function generateComponent<T extends { new(...args: any[]): {} }>(target: TypeOf<T>, opt: ComponentOptions<T>) {
	if (opt.templateUrl) {
		fetchHtml(opt.templateUrl)
			.then(htmlTemplate => {
				if (htmlTemplate) {
					opt.template = htmlTemplate;
					Components.defineComponent(target, opt);
				}
			})
			.catch(reason => {
				console.error(`Error @URL: ${opt.templateUrl}, for model Class: ${target.name},\n Reason: ${reason}.`);
			});
	} else {
		Components.defineComponent(target, opt);
	}
}

export function Component<T extends { new(...args: any[]): {} }>(opt: ComponentOptions<T> | ComponentOptions<T>[]): Function {
	return (target: TypeOf<T>) => {
		if (Array.isArray(opt)) {
			for (const comp of opt) {
				generateComponent(target, comp);
			}
		} else if (typeof opt === 'object') {
			generateComponent(target, opt);
		}
		return target;
	};
}

export function SelfSkip(name?: string): Function {
	return (target: Function, propertyKey: string, index: number) => {
		let metadata = Reflect.getMetadata('selfskip', target, propertyKey);
		if (!metadata) {
			metadata = {};
			Reflect.defineMetadata('selfskip', metadata, target, propertyKey);
		}
		metadata[index] = name;
	};
}

export function Optional(): Function {
	return (target: Function, propertyKey: string, index: number) => {
		let metadata = Reflect.getMetadata('optional', target, propertyKey);
		if (!metadata) {
			metadata = {};
			Reflect.defineMetadata('optional', metadata, target, propertyKey);
		}
		metadata[index] = true;
	};
}

export function customElement<T extends HTMLElement>(opt: { selector: string } & ElementDefinitionOptions): Function {
	return (target: TypeOf<T>) => {
		Components.defineView(target, opt);
		return target;
	};
}
