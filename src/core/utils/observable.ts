
export class Observable {

	private subscribers: Map<string, Function[]> = new Map();

	constructor() { }

	emit(eventName: string, value?: any): void {
		const calls = this.subscribers.get(eventName);
		if (calls) {
			calls.forEach(callback => {
				try {
					callback(value);
				} catch (error) {
					console.error("error at call ", callback.name);
				}
			});
		}
	}

	subscribe(eventName: string, callback: Function): void {
		const calls = this.subscribers.get(eventName);
		if (calls) {
			calls.push(callback);
		} else {
			this.subscribers.set(eventName, [callback]);
		}
	}

	has(eventName: string): boolean {
		return this.subscribers.has(eventName);
	}

	destroy() {
		this.subscribers.clear();
	}
}
