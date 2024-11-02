export class Subscription<T> {
	private othersSubscription: Subscription<any>[];
	constructor(private eventEmitter: EventEmitter<T>) { }
	add(subscription: Subscription<any>) {
		if (!this.othersSubscription) {
			this.othersSubscription = [];
		}
		this.othersSubscription.push(subscription);
	}
	unsubscribe(): void {
		this.eventEmitter.remove(this);
		if (this.othersSubscription) {
			this.othersSubscription.forEach((subscription) => {
				subscription.unsubscribe();
			});
		}
	}
}

interface Subscribe {
	next?: any;
	error?: any;
	complete?: any;
}

export class EventEmitter<T> {
	private subscribers: Map<Subscription<T>, Subscribe> = new Map();
	constructor() { }
	emit(value?: T): void {
		this.subscribers.forEach((subscribe) => {
			try {
				subscribe.next(value);
			} catch (error) {
				try {
					subscribe.error?.(error);
				} catch (error) {
					console.error('error: handling event', error);
				}
			} finally {
				try {
					subscribe.complete?.();
				} catch (error) {
					console.error('error: handling event', error);
				}
			}
		});
	}
	subscribe(next?: any, error?: any, complete?: any): Subscription<T> {
		const subscription: Subscription<T> = new Subscription(this);
		this.subscribers.set(subscription, { next, error, complete });
		return subscription;
	}

	remove(subscription: Subscription<T>) {
		this.subscribers.delete(subscription);
	}
}

