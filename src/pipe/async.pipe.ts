import { EventEmitter, Model, OnDestroy, Pipe, PipeTransform } from '@aurorats/api';

export interface Observer<T> {
    complete: () => void;
    error: (err: any) => void;
    next: (value: T) => void;
}

export interface UnaryFunction<T, R> {
    (source: T): R;
}

export interface OperatorFunction<T, R> extends UnaryFunction<Observable<T>, Observable<R>> { }

export interface Unsubscribable {
    unsubscribe(): void;
}

export type TeardownLogic = Subscription | Unsubscribable | (() => void) | void;

export interface SubscriptionLike extends Unsubscribable {
    readonly closed: boolean;
    unsubscribe(): void;
}

export interface Subscription extends SubscriptionLike {
    closed: boolean;
    add(teardown: TeardownLogic): void;
    remove(teardown: Exclude<TeardownLogic, void>): void;
    unsubscribe(): void;
}

export interface Observable<T> extends Subscribable<T> {
    forEach(next: (value: T) => void): Promise<void>;
    forEach(next: (value: T) => void, promiseCtor: PromiseConstructorLike): Promise<void>;
    pipe(): Observable<T>;
    pipe<A>(op1: OperatorFunction<T, A>): Observable<A>;
    pipe<A, B>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>): Observable<B>;
    pipe<A, B, C>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>): Observable<C>;
    pipe<A, B, C, D>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>): Observable<D>;
    pipe<A, B, C, D, E>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>): Observable<E>;
    pipe<A, B, C, D, E, F>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>): Observable<F>;
    pipe<A, B, C, D, E, F, G>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>): Observable<G>;
    pipe<A, B, C, D, E, F, G, H>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>): Observable<H>;
    pipe<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>): Observable<I>;
    pipe<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>, ...operations: OperatorFunction<any, any>[]): Observable<unknown>;
    subscribe(observer?: Partial<Observer<T>>): Subscription;
    subscribe(next: null | undefined, error: null | undefined, complete: () => void): Subscription;
    subscribe(next: null | undefined, error: (error: any) => void, complete?: () => void): Subscription;
    subscribe(next: (value: T) => void, error: null | undefined, complete: () => void): Subscription;
    subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): Subscription;
    toPromise(): Promise<T | undefined>;
    toPromise(PromiseCtor: typeof Promise): Promise<T | undefined>;
    toPromise(PromiseCtor: PromiseConstructorLike): Promise<T | undefined>;
}


export interface Subscribable<T> {
    subscribe(observer: Partial<Observer<T>>): Unsubscribable;
}


interface SubscriptionStrategy {
    createSubscription(async: Subscribable<any> | Promise<any>, updateLatestValue: any): Unsubscribable
        | Promise<any>;
    dispose(subscription: Unsubscribable | Promise<any>): void;
    onDestroy(subscription: Unsubscribable | Promise<any>): void;
}

class SubscribableStrategy implements SubscriptionStrategy {
    createSubscription(async: Subscribable<any>, updateLatestValue: any): Unsubscribable {
        return async.subscribe({
            next: updateLatestValue,
            error: (e: any) => {
                throw e;
            }
        });
    }

    dispose(subscription: Unsubscribable): void {
        subscription.unsubscribe();
    }

    onDestroy(subscription: Unsubscribable): void {
        subscription.unsubscribe();
    }
}

class PromiseStrategy implements SubscriptionStrategy {
    createSubscription(async: Promise<any>, updateLatestValue: (v: any) => any): Promise<any> {
        return async.then(updateLatestValue, e => {
            throw e;
        });
    }

    dispose(subscription: Promise<any>): void { }

    onDestroy(subscription: Promise<any>): void { }
}

export function isPromise<T = any>(obj: any): obj is Promise<T> {
    // allow any Promise/A+ compliant thenable.
    // It's up to the caller to ensure that obj.then conforms to the spec
    return !!obj && typeof obj.then === 'function';
}

/**
 * Determine if the argument is a Subscribable
 */
export function isSubscribable(obj: any | Subscribable<any>): obj is Subscribable<any> {
    return !!obj && typeof obj.subscribe === 'function';
}

const _promiseStrategy = new PromiseStrategy();
const _subscribableStrategy = new SubscribableStrategy();


@Pipe({ name: 'async', asynchronous: true })
export class AsyncPipe<T> implements Model, OnDestroy, PipeTransform<Subscribable<T> | Promise<T> | null | undefined, T | null> {
    private _latestValue: any = null;

    private _subscription: Unsubscribable | Promise<any> | null = null;
    private _obj: Subscribable<any> | Promise<any> | EventEmitter<any> | null = null;
    private _strategy: SubscriptionStrategy = null!;

    constructor() { }
    __observable: { [key: string]: Function[]; } = {};
    subscribeModel(eventName: string, callback: Function): void {
        if (typeof callback !== 'function') {
            return;
        }
        this.__observable[eventName] = this.__observable[eventName] || [];
        this.__observable[eventName].push(callback);
    }
    emitChangeModel(eventName: string, source?: any[]): void {
        if (!source) {
            source = [this];
        } else {
            source.push(this);
        }
        const calls = Object.keys(this.__observable)
            .filter(key => key.startsWith(eventName) || eventName.startsWith(key));
        calls.forEach(key => {
            this.__observable[key].forEach(callback => callback.call(this, source));
        });
    }

    onDestroy(): void {
        if (this._subscription) {
            this._dispose();
        }
    }

    transform<T>(obj: Subscribable<T> | Promise<T>): T | null;
    transform<T>(obj: null | undefined): null;
    transform<T>(obj: Subscribable<T> | Promise<T> | null | undefined): T | null;
    transform<T>(obj: Subscribable<T> | Promise<T> | null | undefined): T | null {
        if (!this._obj) {
            if (obj) {
                this._subscribe(obj);
            }
            return this._latestValue;
        }

        if (obj !== this._obj) {
            this._dispose();
            return this.transform(obj);
        }

        return this._latestValue;
    }

    private _subscribe(obj: Subscribable<any> | Promise<any> | EventEmitter<any>): void {
        this._obj = obj;
        this._strategy = this._selectStrategy(obj);
        this._subscription = this._strategy.createSubscription(
            obj, (value: Object) => this._updateLatestValue(obj, value));
    }

    private _selectStrategy(obj: Subscribable<any> | Promise<any> | EventEmitter<any>): any {
        if (isPromise(obj)) {
            return _promiseStrategy;
        }

        if (isSubscribable(obj)) {
            return _subscribableStrategy;
        }

        throw Error(`InvalidPipeArgument: '${AsyncPipe}' for pipe '${obj}'`);
    }

    private _dispose(): void {
        this._strategy.dispose(this._subscription!);
        this._latestValue = null;
        this._subscription = null;
        this._obj = null;
    }

    private _updateLatestValue(async: any, value: Object): void {
        if (async === this._obj) {
            this._latestValue = value;
            this.emitChangeModel('async');
            // this._ref.markForCheck();
        }
    }
}


Reflect.set(window, 'AsyncPipe', AsyncPipe);
