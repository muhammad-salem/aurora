import { ArrayExpression, JavaScriptParser, ReactiveScope, ScopeSubscription, Stack } from '@ibyar/expressions';
import type { ListenerRef } from '../component/reflect.js';
import type { RenderHandler } from './render-handler.js';
import type { AuroraZone } from '../zone/zone.js';

type ElementScope = { [templateName: string]: HTMLElement };
export type HostHandlerOptions<T = any> = { host: HTMLElement, model: T, zone: AuroraZone, templateScope: ReactiveScope<ElementScope> };

/**
 * ```ts
 * @Component({selector: 'tag-name'})
 * class ComponentModelOrAttributeDirectiveModel {
 * 
 *	@HostListener('window:load', ['$event.target', '"load"'])
 * 	@HostListener('click', ['$event.target', '"click"'])
 * 	public onClick(target: any, type: string){
 * 		console.log(target, type);
 * 	}
 * 
 * }
 * ```
 * 
 * window.addEventListener('load', $event => listener($event.target, 'load'));
 * 
 * view.addEventListener('click', $event => listener($event.target, 'click'));
 * 
 */
export class HostListenerHandler implements RenderHandler {

	private source: HTMLElement | Window;
	private eventName: string;

	private argumentsExpression: ArrayExpression;
	private stack: Stack;

	private scopeSubscription?: ScopeSubscription<ElementScope>;


	private listener = (event: Event) => {
		const callback: Function | undefined = this.options.model[this.listenerRef.modelCallbackName];
		if (typeof callback !== 'function') {
			return
		}
		const eventScope = this.stack.pushBlockScopeFor({ $event: event });
		const params = this.argumentsExpression.get(this.stack);
		this.stack.clearTo(eventScope);
		this.options.zone.run(
			callback as () => void,
			this.options.model,
			params
		);
		typeof event.preventDefault === 'function' && event.preventDefault();
	};

	constructor(private listenerRef: ListenerRef, private options: HostHandlerOptions) {
		this.stack = new Stack(this.options.templateScope);
	}
	onInit(): void {
		const args = this.listenerRef.args ?? [];
		const array = `[${args.join(', ')}]`;
		this.argumentsExpression = JavaScriptParser.parseScript(array) as ArrayExpression;
		if (this.listenerRef.eventName.includes(':')) {
			const [eventSource, eventName] = this.listenerRef.eventName.split(':', 2);
			this.eventName = eventName;
			if ('window' === eventSource.toLowerCase()) {
				this.source = window;
			} else {
				let source = this.options.templateScope.get(eventSource) as HTMLElement;
				this.scopeSubscription = this.options.templateScope.subscribe(eventSource, (newValue: HTMLElement) => {
					if (source !== newValue) {
						if (source) {
							this.removeEventListener();
						}
					} else if (!newValue) {
						this.removeEventListener();
					}
					source = newValue;
					this.addEventListener();
				});
				this.source = source;
			}
		} else {
			this.eventName = this.listenerRef.eventName;
			this.source = this.options.host;
		}
		this.addEventListener();
	}

	private addEventListener() {
		this.source?.addEventListener(this.eventName, this.listener);
	}

	private removeEventListener() {
		this.source?.removeEventListener(this.eventName, this.listener);
	}

	onConnect() {
		this.scopeSubscription?.resume();
	}

	onDisconnect() {
		this.scopeSubscription?.pause();
	}

	onDestroy(): void {
		this.scopeSubscription?.unsubscribe();
		this.removeEventListener();
	}

}
