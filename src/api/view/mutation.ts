import { Observable } from '../utils/observable.js';

export class ElementMutation {

	observableMap: WeakMap<Node, Observable>;
	mutationObserver: MutationObserver;

	constructor() {
		this.observableMap = new WeakMap();
		this.mutationObserver = new MutationObserver((mutations) => {
			mutations.forEach((mut) => {
				if (mut.type === 'attributes') {
					let observable = this.getObservableOrDefine(mut.target);
					observable.emit(mut.attributeName as string);
				}
			});
		});
	}

	subscribe(element: HTMLElement, propName: string, callback: Function) {
		const observable = this.getObservableOrDefine(element);
		observable.subscribe(propName, callback);
	}

	private getObservableOrDefine(element: Node): Observable {
		let observable = this.observableMap.get(element);
		if (observable) {
			return observable;
		}
		observable = new Observable();
		this.observableMap.set(element, observable);
		this.mutationObserver.observe(element, {
			attributes: true,
			childList: false,
			subtree: false
		});
		return observable;
	}

	disconnect() {
		this.mutationObserver.disconnect();
	}
}
