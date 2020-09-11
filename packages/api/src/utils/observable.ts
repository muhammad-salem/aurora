
interface ObservedCallback {
    oldValue?: any;
    callbackArray: Function[];
}

export class Observable {

    private subscripers: Map<string, Function[]> = new Map();
    
    constructor() { }
    
    emit(eventName: string, value?: any): void {
        const calls = this.subscripers.get(eventName);
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
        const calls = this.subscripers.get(eventName);
        if (calls) {
            calls.push(callback);
        } else {
            this.subscripers.set(eventName, [callback]);
        }
    }

    has(eventName: string): boolean {
        return this.subscripers.has(eventName);
    }

    destroy() {
        this.subscripers.clear();
    }
}


export class SimmlerObservable {
    private subscripers: Map<string, Function[]> = new Map();
    constructor() { }
    emit(propertyPath: string): void {
        [...this.subscripers.keys()]
            .filter(key => key?.startsWith(propertyPath) || propertyPath.startsWith(key))
            // .filter(key => propertyPath.startsWith(key))
            // .filter(key => key === propertyPath)
            .map(key => this.subscripers.get(key))
            .forEach(callbacks => {
                callbacks?.forEach(callback => {
                    try {
                        callback();
                    } catch (error) {
                        console.error("error at call ", callback.name);
                    }
                });
            });
    }

    emitValue(propertyPath: string, value?: any): void {
        this.subscripers.get(propertyPath)?.forEach(callback => {
            try {
                callback(value);
            } catch (error) {
                console.error("error at call ", callback.name);
            }
        });
    }

    subscribe(attrName: string, callback: Function): void {
        const callbacks = this.subscripers.get(attrName);
        if (callbacks) {
            callbacks.push(callback);
        } else {
            this.subscripers.set(attrName, [callback]);
        }
    }

    removeSubscription(attrName: string, callback: Function): void {
        const callbacks = this.subscripers.get(attrName);
        if (callbacks) {
            let index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    has(attrName: string): boolean {
        return this.subscripers.has(attrName);
    }

    destroy() {
        this.subscripers.clear();
    }
}
