interface AttributeChangeCallback {
	(value: any, oldValue?: any): void;
}

interface NodeRemoveCallback {
	(): void;
}


export class MutationObservable {
	private attributes = new Map<string, AttributeChangeCallback[]>();
	private remove = new WeakMap<Node, NodeRemoveCallback[]>();

	emit(attributeName: string, value: any, oldValue?: any): void {
		const calls = this.attributes.get(attributeName);

		calls?.forEach(callback => {
			try {
				callback(value, oldValue);
			} catch (error) {
				console.error(error);
			}
		});

	}

	emitNodeRemove(node: Node): void {
		const calls = this.remove.get(node);

		calls?.forEach(callback => {
			try {
				callback();
			} catch (error) {
				console.error(error);
			}
		});
	}

	subscribe(attributeName: string, callback: AttributeChangeCallback): MutationSubscription {
		let calls = this.attributes.get(attributeName);
		if (!calls) {
			calls = [];
			this.attributes.set(attributeName, calls);
		}
		calls.push(callback);
		return new MutationSubscription(this, attributeName, callback);
	}

	subscribeOnRemoveNode(node: Node, callback: NodeRemoveCallback): MutationSubscription {
		let calls = this.remove.get(node);
		if (!calls) {
			calls = [];
			this.remove.set(node, calls);
		}
		calls.push(callback);
		return new MutationSubscription(this, node, callback);
	}

	unsubscribe(eventName: string, callback: AttributeChangeCallback): void {
		const calls = this.attributes.get(eventName);
		if (calls) {
			const index = calls.indexOf(callback);
			if (index !== -1) {
				calls.splice(index, 1);
			}
		}
	}

	unsubscribeOnRemoveNode(node: Node, callback: NodeRemoveCallback): void {
		const calls = this.remove.get(node);
		if (calls) {
			const index = calls.indexOf(callback);
			if (index !== -1) {
				calls.splice(index, 1);
			}
		}
	}

	destroy() {
		this.attributes.clear();
	}
}

export class MutationSubscription {

	private type: 'attribute' | 'remove';
	constructor(observable: MutationObservable, node: Node, callback: NodeRemoveCallback);
	constructor(observable: MutationObservable, attributeName: string, callback: AttributeChangeCallback);

	constructor(private observable: MutationObservable, private key: string | Node, private callback: AttributeChangeCallback | NodeRemoveCallback) {
		this.type = typeof key === 'string' ? 'attribute' : 'remove';
	}

	unsubscribe() {
		if (this.type === 'attribute') {
			this.observable.unsubscribe(this.key as string, this.callback as AttributeChangeCallback);
		} else {
			this.observable.unsubscribeOnRemoveNode(this.key as Node, this.callback as NodeRemoveCallback);
		}
	}
}



export class ElementMutation {

	private static Mutation_OPTIONS: MutationObserverInit = {
		attributes: true,
		childList: true,
		subtree: true,
		attributeOldValue: true,
	};

	private observables: WeakMap<Node, MutationObservable> = new WeakMap();
	private mutationCallback: MutationCallback = (mutations: MutationRecord[], observer: MutationObserver) => {
		mutations.forEach((mut) => {
			switch (mut.type) {
				case 'childList':
					{
						// insert/remove events
						if (mut.removedNodes.length > 0 && this.observables.has(mut.target)) {
							const observable = this.observables.get(mut.target)!;
							mut.removedNodes.forEach(node => observable.emitNodeRemove(node));
						}
					}
					break;
				case 'attributes':
				default:
					{
						const observable = this.observables.get(mut.target);
						observable && observable.emit(mut.attributeName as string, mut.target.nodeValue, mut.oldValue);
					}
					break;
			}
		});
	};
	private mutationObserver: MutationObserver = new MutationObserver(this.mutationCallback);

	subscribe(target: Node, attributeName: string, callback: AttributeChangeCallback): MutationSubscription {
		let observable = this.observables.get(target);
		if (!observable) {
			observable = new MutationObservable();
			this.observables.set(target, observable);
		}
		return observable.subscribe(attributeName, callback);
	}

	subscribeOnRemoveNode(target: Node, node: Node, callback: NodeRemoveCallback): MutationSubscription {
		let observable = this.observables.get(target);
		if (!observable) {
			observable = new MutationObservable();
			this.observables.set(target, observable);
		}
		return observable.subscribeOnRemoveNode(node, callback);
	}

	disconnect() {
		const records = this.mutationObserver.takeRecords();
		this.mutationObserver.disconnect();
		this.mutationCallback(records, this.mutationObserver);
	}
}
