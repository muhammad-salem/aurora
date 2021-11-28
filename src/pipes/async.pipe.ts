
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */


import { AsyncPipeTransform, OnDestroy, Pipe, PipeTransform } from '@ibyar/core';

interface Observer<T> {
	complete: () => void;
	error: (err: any) => void;
	next: (value: T) => void;
}

interface UnaryFunction<T, R> {
	(source: T): R;
}

interface OperatorFunction<T, R> extends UnaryFunction<Observable<T>, Observable<R>> { }

interface Unsubscribable {
	unsubscribe(): void;
}

type TeardownLogic = Subscription | Unsubscribable | (() => void) | void;

interface SubscriptionLike extends Unsubscribable {
	readonly closed: boolean;
	unsubscribe(): void;
}

interface Subscription extends SubscriptionLike {
	closed: boolean;
	add(teardown: TeardownLogic): void;
	remove(teardown: Exclude<TeardownLogic, void>): void;
	unsubscribe(): void;
}

interface Observable<T> extends Subscribable<T> {
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


interface Subscribable<T> {
	subscribe(observer: Partial<Observer<T>>): Unsubscribable;
}

interface Subscriber<T> extends Subscription, Observer<T> {
	complete(): void;
	error(err?: any): void;
	next(value?: T): void;
	unsubscribe(): void;
}
interface Operator<T, R> {
	call(subscriber: Subscriber<R>, source: any): TeardownLogic;
}

interface Subject<T> extends Observable<T>, SubscriptionLike {
	closed: boolean;
	hasError: boolean;
	isStopped: boolean;
	observers: Observer<T>[];
	thrownError: any;
	asObservable(): Observable<T>;
	complete(): void;
	error(err: any): void;
	lift<R>(operator: Operator<T, R>): Observable<R>;
	next(value: T): void;
	unsubscribe(): void;
}
interface EventEmitter<T> extends Subject<T> {
	__isAsync: boolean;
	new(isAsync?: boolean): EventEmitter<T>;
	emit(value?: T): void;
	subscribe(generatorOrNext?: any, error?: any, complete?: any): Subscription;
}

interface SubscriptionStrategy {
	createSubscription(async: Subscribable<any> | Promise<any>, updateLatestValue: any): Unsubscribable | Promise<any>;
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

function isPromise<T = any>(obj: any): obj is Promise<T> {
	// allow any Promise/A+ compliant thenable.
	// It's up to the caller to ensure that obj.then conforms to the spec
	return !!obj && typeof obj.then === 'function';
}

type CanSubscribe<T> = Subscribable<T> | Observable<T> | EventEmitter<T>;

/**
 * Determine if the argument is a Subscribable
 */
function isSubscribable<T>(obj: any | CanSubscribe<T>): obj is CanSubscribe<T> {
	return !!obj && typeof obj.subscribe === 'function';
}

const _promiseStrategy = new PromiseStrategy();
const _subscribableStrategy = new SubscribableStrategy();


@Pipe({ name: 'async', asynchronous: true })
export class AsyncPipe<T> extends AsyncPipeTransform<Observable<T> | Subscribable<T> | EventEmitter<T> | Promise<T> | null | undefined, T | null> implements OnDestroy {
	private _latestValue: any = null;

	private _subscription: Unsubscribable | Promise<any> | null = null;
	private _obj: Subscribable<any> | Observable<T> | EventEmitter<T> | Promise<any> | null = null;
	private _strategy: SubscriptionStrategy = null!;

	onDestroy(): void {
		if (this._subscription) {
			this._dispose();
		}
	}

	transform(obj: Subscribable<T> | Observable<T> | EventEmitter<T> | Promise<T>): T | null;
	transform(obj: null | undefined): null;
	transform(obj: Subscribable<T> | Observable<T> | EventEmitter<T> | Promise<T> | null | undefined): T | null;
	transform(obj: Subscribable<T> | Observable<T> | EventEmitter<T> | Promise<T> | null | undefined): T | null {
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

	private _subscribe(obj: Subscribable<any> | Observable<T> | Promise<any>): void {
		this._obj = obj;
		this._strategy = this._selectStrategy(obj);
		this._subscription = this._strategy.createSubscription(obj, (value: Object) => this._updateLatestValue(obj, value));
	}

	private _selectStrategy(obj: Subscribable<any> | Observable<T> | Promise<any>): any {
		if (isPromise(obj)) {
			return _promiseStrategy;
		}

		if (isSubscribable(obj)) {
			return _subscribableStrategy;
		}

		throw Error(`InvalidPipeArgument: '${AsyncPipe.name}' for pipe '${obj}'`);
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
			this.changeDetectorRef.markForCheck();
		}
	}
}
