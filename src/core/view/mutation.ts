import { Observable } from '../utils/observable.js';

export class ElementMutation {

	private attributeObservables: WeakMap<Node, Observable> = new WeakMap();
	private mutationObserver: MutationObserver = new MutationObserver((mutations) => {
		mutations.forEach((mut) => {
			if (mut.type === 'attributes') {
				const observable = this.attributeObservables.get(mut.target);
				observable && observable.emit(mut.attributeName as string);
			}
		});
	});

	subscribeOnAttribute(element: HTMLElement, propName: string, callback: Function) {
		let observable = this.attributeObservables.get(element);
		observable ?? (observable = this.createObservable(element));
		observable.subscribe(propName, callback);
	}

	private createObservable(element: Node): Observable {
		const observable = new Observable();
		this.attributeObservables.set(element, observable);
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
