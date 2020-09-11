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

interface Subscrip {
	next?: any;
	error?: any;
	complete?: any;
}

export class EventEmitter<T> {
	private subscripers: Map<Subscription<T>, Subscrip> = new Map();
	constructor() { }
	emit(value?: T): void {
		this.subscripers.forEach((subscrip) => {
			try {
				subscrip.next(value);
			} catch (error) {
				try {
					if (subscrip.error) {
						subscrip.error(error);
					}
				} catch (error) {
					console.error('error: handeling event');
				}
			} finally {
				try {
					if (subscrip.complete) {
						subscrip.complete();
					}
				} catch (error) {
					console.error('error: handeling event');
				}
			}
		});
	}
	subscribe(next?: any, error?: any, complete?: any): Subscription<T> {
		const subscription: Subscription<T> = new Subscription(this);
		this.subscripers.set(subscription, { next, error, complete });
		return subscription;
	}

	remove(subscription: Subscription<T>) {
		this.subscripers.delete(subscription);
	}
}
