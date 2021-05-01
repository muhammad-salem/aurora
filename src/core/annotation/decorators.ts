import type { TypeOf } from '../utils/typeof.js';
import type { ExpressionNode } from '@ibyar/expressions/api';
import { DomNode, DomRenderNode } from '@ibyar/elements';
import { Components } from '../component/component.js';
import { fetchHtml, TemplateUrl } from '../utils/path.js';

export interface DirectiveOptions {
	selector: string;
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
	 * 			 TypeOf 'AuroraRootRenderNode<T>' ==> JSX, create factory
	 * 	if template === null || undefined ==> it had nothing to render, 
	 * and may be inherit from an html element
	 * 
	 * 2 possible way to write a template, as inline string, represent a a valid html, 
	 * or us aurora jsx factory 
	 * 				
	 */
	template?: string | DomNode<ExpressionNode> | DomRenderNode<T, ExpressionNode>;
	/**
	 * style for this element
	 */
	styles?: string | { [key: string]: string }[];
	/**
	 * what basic element should the new component inherit from,
	 * the tag name to inherit from as 'a', 'div', 'table', 'td', 'th', 'tr', etc ...
	 */
	extend?: string;

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
		Components.addInput(target, propertyKey, name || propertyKey);
	};
}
export function Output(name?: string): Function {
	return (target: Object, propertyKey: string) => {
		Components.addOutput(target, propertyKey, name || propertyKey);
	};
}

export function View(): Function {
	return (target: Object, propertyKey: string) => {
		Components.setComponentView(target, propertyKey);
	};
}

export function ViewChild(selector: string | typeof HTMLElement | CustomElementConstructor,
	childOptions?: ChildOptions): Function {
	return (target: Object, propertyKey: string) => {
		Components.addViewChild(target, propertyKey, selector, childOptions);
	};
}

export function ViewChildren(selector: string | typeof HTMLElement | CustomElementConstructor): Function {
	return (target: Object, propertyKey: string) => {
		Components.addViewChildren(target, propertyKey, selector);
	};
}

export function HostListener(eventName: string, args?: string[]): Function {
	return (target: Object, propertyKey: string) => {
		Components.addHostListener(
			target,
			propertyKey,
			eventName,
			args || []
		);
	};
}

export function HostBinding(hostPropertyName: string): Function {
	return (target: Object, propertyKey: string) => {
		Components.addHostBinding(target, propertyKey, hostPropertyName);
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

export function Component<T extends object>(opt: ComponentOptions<T>): Function {
	return (target: TypeOf<T>) => {
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
		return target;
	};
}

export function SelfSkip(name?: string): Function {
	return (target: Function, propertyKey: string, index: number) => {
		Reflect.defineMetadata('selfskip', { name, index }, target, propertyKey);
	};
}

export function Optional(): Function {
	return (target: Function, propertyKey: string, index: number) => {
		Reflect.defineMetadata('optional', { index }, target, propertyKey);
	};
}
