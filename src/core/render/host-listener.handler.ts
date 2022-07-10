import { ArrayExpression, JavaScriptParser, ReactiveScope, ScopeSubscription, Stack } from '@ibyar/expressions';
import { ListenerRef } from '../component/component.js';
import { HTMLComponent } from '../component/custom-element.js';
import { RenderHandler } from './render-handler.js';

type ElementScope = { [element: string]: HTMLElement };

/**
 * ```ts
 * class View {
 * 
 *	@HostListener('window:load', ['$event.target', '"load"'])
 * 	@HostListener('click', ['$event.target', '"click"'])
 * 	public onClick(target: any, type: string){
 * 		console.log(target, type);
 * 	}
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
		const callback: Function | undefined = this.element._model[this.listenerRef.modelCallbackName];
		if (typeof callback === 'function') {
			const eventScope = this.stack.pushBlockScopeFor({ $event: event });
			const params = this.argumentsExpression.get(this.stack);
			this.stack.clearTo(eventScope);
			this.element._auroraZone.runScopeTask(
				this.element._modelScope,
				callback as () => void,
				this.element._model,
				params
			);
			typeof event.preventDefault === 'function' && event.preventDefault();
		}
	};

	constructor(private listenerRef: ListenerRef, private element: HTMLComponent<any>, private elementScope: ReactiveScope<ElementScope>) {
		this.stack = new Stack(elementScope);
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
				let source = this.elementScope.get(eventSource) as HTMLElement;
				this.scopeSubscription = this.elementScope.subscribe(eventSource, (newValue: HTMLElement) => {
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
			this.source = this.element;
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
