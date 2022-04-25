import { ReactiveScope, ScopeSubscription } from '@ibyar/expressions';
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
 * window.addEventListener('load', function($event, arg0 = $event.target, arg1 = 'load') {listener(arg0, arg1);});
 * 
 * window.addEventListener('load', function($event) {listener($event.target, 'load');});
 * 
 * window.addEventListener('load', $event => listener($event.target, 'load'));
 * 
 * 
 * view.addEventListener('click', function($event, arg0 = $event.target, arg1 = 'click') {listener(arg0, arg1)});
 * 
 * view.addEventListener('click', function($event) {listener($event.target, 'click');});
 * 
 * view.addEventListener('click', $event => listener($event.target, 'click'));
 * 
 */
export class HostListenerHandler implements RenderHandler {

	private source: HTMLElement | Window;
	private eventName: string;

	private scopeSubscription?: ScopeSubscription<ElementScope>;


	private listener = (event: any) => {
		this.element._proxyModel[this.listenerRef.modelCallbackName](event);
	};

	constructor(private listenerRef: ListenerRef, private element: HTMLComponent<any>, private elementScope: ReactiveScope<ElementScope>) { }
	onInit(): void {
		this.listenerRef.eventName
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
