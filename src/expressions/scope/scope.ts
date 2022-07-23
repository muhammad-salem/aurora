import { TypeOf } from '../api/utils.js';

export type Context = Record<PropertyKey, any>;
export interface Scope<T = Context> {

	/**
	 * get value of `propertyKey` in current context
	 * @param propertyKey 
	 */
	get(propertyKey: keyof T): any;

	/**
	 * set the value of `propertyKey` in current context, could be instilled with `value`.
	 * @param propertyKey 
	 * @param value 
	 * @param receiver 
	 */
	set(propertyKey: keyof T, value?: any, receiver?: any): boolean;

	/**
	 * is current context has `propertyKey` in hash map keys
	 * @param propertyKey 
	 */
	has(propertyKey: keyof T): boolean;

	/**
	 * delete property from context
	 * @param propertyKey 
	 */
	delete(propertyKey: keyof T): boolean;

	/**
	 * get current context object of this scope
	 */
	getContext(): T;

	/**
	 * get a proxy of the current context object if exists. 
	 */
	getContextProxy?(): T;

	/**
	 * get a scope for an object named as `propertyKey` from cache map,
	 * 
	 * if the current value is not type od `object`, will return `undefined`.
	 * @param propertyKey the name of the property
	 */
	getInnerScope<S extends Scope<Context>>(propertyKey: keyof T): S | undefined;

	/**
	 * create a scope with the same type of this scope
	 */
	setInnerScope<S extends Scope<Context>>(propertyKey: keyof T): S;

	/**
	 * sc
	 * @param propertyKey 
	 * @param scope 
	 */
	setInnerScope<S extends Scope<Context>>(propertyKey: keyof T, scope?: S): S;

	getClass(): TypeOf<Scope<Context>>;
}

export class Scope<T extends Context> implements Scope<T> {
	static for<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		return new Scope(ctx, propertyKeys);
	}
	static blockScope<T extends Context>(propertyKeys?: (keyof T)[]) {
		return new Scope({} as T, propertyKeys);
	}

	protected _inners = new Map<keyof T, Scope<any>>();

	constructor(context: T, propertyKeys?: (keyof T)[]);
	constructor(protected _ctx: T, protected _keys?: (keyof T)[]) {
		if (Array.isArray(this._keys)) {
			this.has = (key: keyof T): boolean => {
				return this._keys!.includes(key);
			};
		}
	}
	get(key: keyof T): any {
		return Reflect.get(this._ctx, key);
	}
	set(key: keyof T, value: any, receiver?: any): boolean {
		return Reflect.set(this._ctx, key, value);
	}
	has(key: keyof T): boolean {
		return key in this._ctx;
	}
	delete(key: keyof T): boolean {
		return Reflect.deleteProperty(this._ctx, key);
	}
	getContext(): T {
		return this._ctx;
	}
	getInnerScope<S extends Scope<Context>>(key: keyof T): S | undefined {
		const ctx = this.get(key);
		let scope = this._inners.get(key);
		if (scope) {
			scope._ctx = ctx;
			return scope as S;
		}
		if (!(ctx && typeof ctx === 'object')) {
			return;
		}
		scope = new (this.getClass())(ctx, undefined, key, this);
		this._inners.set(key, scope);
		return scope as S;
	}
	setInnerScope<S extends Scope<Context>>(key: keyof T, scope?: S): S {
		if (scope) {
			this._inners.set(key, scope);
			return scope;
		}
		const ctx = this.get(key);
		scope = new (this.getClass())(ctx, undefined, key, this) as S;
		this._inners.set(key, scope);
		return scope;
	}
	getClass(): TypeOf<Scope<Context>> {
		return Scope;
	}
}

export class ReadOnlyScope<T extends Context> extends Scope<T> {
	static for<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope(ctx, propertyKeys);
	}
	static blockScope<T extends Context>(propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope({} as T, propertyKeys);
	}
	set(propertyKey: keyof T, value: any, receiver?: any): boolean {
		// do nothing
		return false;
	}
	delete(propertyKey: keyof T): boolean {
		// do nothing
		return false;
	}
	getClass(): TypeOf<ReadOnlyScope<Context>> {
		return ReadOnlyScope;
	}
}

export class ScopeSubscription<T> {
	constructor(private propertyKey: keyof T, private observer: ValueChangeObserver<T>) { }
	pause() {
		this.observer.pause(this.propertyKey, this);
	}
	resume() {
		this.observer.resume(this.propertyKey, this);
	}
	unsubscribe(): void {
		this.observer.unsubscribe(this.propertyKey, this);
	}
}

export type ValueChangedCallback = (newValue: any, oldValue?: any) => void;

type SubscriptionInfo = { callback: ValueChangedCallback, enable: boolean };

export class ValueChangeObserver<T> {
	private _subscribers: Map<keyof T, Map<ScopeSubscription<T>, SubscriptionInfo>> = new Map();
	private _lock: (keyof T)[] = [];
	emit(propertyKey: keyof T, newValue: any, oldValue?: any): void {
		if (this._lock.includes(propertyKey)) {
			return;
		}
		const subscribers = this._subscribers.get(propertyKey);
		if (!subscribers || subscribers.size == 0) {
			return;
		}
		this._lock.push(propertyKey);
		subscribers?.forEach(subscriptionInfo => {
			if (!subscriptionInfo.enable) {
				return;
			}
			try {
				subscriptionInfo.callback(newValue, oldValue);
			} catch (e) {
				console.error(e);
			}
		});
		if (this._lock.pop() !== propertyKey) {
			console.error('lock error');
		};
	}
	subscribe(propertyKey: keyof T, callback: ValueChangedCallback): ScopeSubscription<T> {
		const subscription: ScopeSubscription<T> = new ScopeSubscription(propertyKey, this);
		let propertySubscribers = this._subscribers.get(propertyKey);
		if (!propertySubscribers) {
			propertySubscribers = new Map();
			this._subscribers.set(propertyKey, propertySubscribers);
		}
		propertySubscribers.set(subscription, { callback, enable: true });
		return subscription;
	}

	unsubscribe(propertyKey: keyof T, subscription?: ScopeSubscription<T>) {
		if (subscription) {
			this._subscribers.get(propertyKey)?.delete(subscription);
		} else {
			this._subscribers.delete(propertyKey);
		}
	}

	pause(propertyKey: keyof T, subscription: ScopeSubscription<T>) {
		const subscriptionInfo = this._subscribers.get(propertyKey)?.get(subscription);
		subscriptionInfo && (subscriptionInfo.enable = false);
	}

	resume(propertyKey: keyof T, subscription: ScopeSubscription<T>) {
		const subscriptionInfo = this._subscribers.get(propertyKey)?.get(subscription);
		subscriptionInfo && (subscriptionInfo.enable = true);
	}

	/**
	 * check if this Observer has any subscribers
	 */
	hasSubscribers(): boolean;

	/**
	 * check if there is any subscribers registered by the propertyKey.
	 * 
	 * @param propertyKey
	 */
	hasSubscribers(propertyKey: keyof T): boolean;
	hasSubscribers(propertyKey?: keyof T): boolean {
		if (propertyKey) {
			return (this._subscribers.get(propertyKey)?.size ?? 0) > 0;
		}
		return this._subscribers.size > 0;
	}

	/**
	 * clear subscription maps
	 */
	destroy() {
		this._subscribers.clear();
	}
}

export class ReactiveScope<T extends Context> extends Scope<T> {
	static for<T extends Context>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScope(context, propertyKeys);
	}
	static blockScope<T extends Context>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScope({} as T, propertyKeys);
	}
	static scopeForThis<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		const thisScope = ReactiveScope.for(ctx, propertyKeys);
		const thisCtx = {
			'this': ctx,
		};
		const rootScope = Scope.for(thisCtx, ['this']);
		rootScope.setInnerScope('this', thisScope);
		return rootScope;
	}
	static readOnlyScopeForThis<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		const thisScope = ReactiveScope.for(ctx, propertyKeys);
		const thisCtx = {
			'this': ctx,
		};
		const rootScope = ReadOnlyScope.for(thisCtx, ['this']);
		rootScope.setInnerScope('this', thisScope);
		return rootScope;
	}
	protected _clone: T;
	declare protected _inners: Map<keyof T, ReactiveScope<any>>;
	protected _observer: ValueChangeObserver<T> = new ValueChangeObserver<T>();


	constructor(context: T, propertyKeys?: (keyof T)[], protected _name?: keyof T, protected _parent?: ReactiveScope<any>) {
		super(context, propertyKeys);
		this._clone = Object.assign({}, context);
		if (HTMLElement && context instanceof HTMLElement) {
			this._keys = [];
		}
	}

	set(propertyKey: keyof T, newValue: any, receiver?: any): boolean {
		const oldValue = Reflect.get(this._ctx, propertyKey);
		const result = Reflect.set(this._ctx, propertyKey, newValue);
		if (result) {
			this.emit(propertyKey, newValue, oldValue);
		}
		return result;
	}
	delete(propertyKey: keyof T): boolean {
		const oldValue = Reflect.get(this._ctx, propertyKey);
		const isDelete = Reflect.deleteProperty(this._ctx, propertyKey);
		if (isDelete && oldValue !== undefined) {
			this.emit(propertyKey, undefined, oldValue);
		}
		return isDelete;
	}
	emit(propertyKey: keyof T, newValue: any, oldValue?: any): void {
		this._observer.emit(propertyKey, newValue, oldValue);
		this._parent?.emit(this._name!, this._ctx);
	}
	subscribe(propertyKey: keyof T, callback: ValueChangedCallback): ScopeSubscription<T> {
		return this._observer.subscribe(propertyKey, callback);
	}
	unsubscribe(propertyKey?: keyof T, subscription?: ScopeSubscription<T>) {
		if (propertyKey && subscription) {
			this._observer.unsubscribe(propertyKey, subscription);
		} else if (propertyKey) {
			this._observer.unsubscribe(propertyKey);
		} else {
			this._observer.destroy();
		}
	}
	detectChanges() {
		const previous = this._clone;
		const current = this._ctx;
		if ((!!!previous && !!current) || (!!previous && !!!current)) {
			this._parent?.emit(this._name!, current);
			return;
		}
		const keys = this._keys ?? this.getPropertyKeys(previous, current);
		keys.forEach(key => {
			const pv = previous[key];
			const cv = current[key];
			const pt = typeof pv;
			const ct = typeof cv;
			if (pt === 'object') {
				if (ct === 'object') {
					this.getInnerScope<ReactiveScope<Context>>(key)?.detectChanges();
				} else if (cv != pv) {
					this.emit(key, cv, pv);
				}
			} else if (ct === 'object') {
				this.emit(key, cv, pv);
			} else if (pv != cv) {
				this.emit(key, cv, pv);
			}
		});
		this._clone = Object.assign({}, this._ctx);
	}
	protected getPropertyKeys<V extends Record<PropertyKey, any>>(...objs: V[]) {
		let keys: (keyof V)[] = [];
		objs.forEach(obj => {
			keys.push(...Object.keys(obj));
			keys.push(...Object.getOwnPropertySymbols(obj));
		});
		keys = Array.from(new Set(keys));
		keys = keys.filter(key => {
			switch (typeof key) {
				case 'string':
					return !key.startsWith('_');
				case 'symbol':
					return !key.toString().startsWith('Symbol(_');
				default:
					return false;
			}
		});
		return keys;
	}
	getClass(): TypeOf<ReactiveScope<Context>> {
		return ReactiveScope;
	}
}

/**
 * used control/notify/pause scope about changes in current context
 */
export interface ScopeControl<T extends Context> {

	/**
	 * get current stacte of applying change detection.
	 */
	isAttached(): boolean;

	/**
	 * used when want to update ui-view like, you want to replace an array with another 
	 * without reflect changes on view until reattached again.
	 */
	detach(): void;

	/**
	 * apply all the not emitted changes, and continue emit in time.
	 */
	reattach(): void;

	/**
	 * apply changes now,
	 * will not effect the state of the detector wither if attached ot not.
	 * 
	 * if a propertyKey is provided, will emit this property only 
	 * @param propertyKey 
	 */
	emitChanges(propertyKey?: keyof T, propertyValue?: any): void;

	/**
	 * throw error if any changes has been made
	 */
	checkNoChanges(): void;
}

export class ReactiveScopeControl<T extends Context> extends ReactiveScope<T> implements ScopeControl<T> {
	static for<T extends Context>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl(context, propertyKeys);
	}
	static blockScope<T extends Context>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl({} as T, propertyKeys);
	}
	static scopeForThis<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		const thisScope = ReactiveScopeControl.for(ctx, propertyKeys);
		const thisCtx = {
			'this': ctx,
		};
		const rootScope = Scope.for(thisCtx, ['this']);
		rootScope.setInnerScope('this', thisScope);
		return rootScope;
	}
	static readOnlyScopeForThis<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		const thisScope = ReactiveScopeControl.for(ctx, propertyKeys);
		const thisCtx = {
			'this': ctx,
		};
		const rootScope = ReadOnlyScope.for(thisCtx, ['this']);
		rootScope.setInnerScope('this', thisScope);
		return rootScope;
	}
	static reactiveScopeForThis<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		const thisScope = ReactiveScope.for(ctx, propertyKeys);
		const thisCtx = {
			'this': ctx,
		};
		const rootScope = Scope.for(thisCtx, ['this']);
		rootScope.setInnerScope('this', thisScope);
		return rootScope;
	}

	protected _attached: boolean = true;
	protected _marked: { [key: keyof Context]: [any, any] } = {};

	override emit(propertyKey: keyof T, newValue: any, oldValue?: any): void {
		if (this._attached) {
			super.emit(propertyKey, newValue, oldValue);
		} else if (this._marked[propertyKey as string]) {
			if (newValue == this._marked[propertyKey as string][1]) {
				delete this._marked[propertyKey as string];
			} else {
				this._marked[propertyKey as string][0] = newValue;
			}
		} else {
			this._marked[propertyKey as string] = [newValue, oldValue];
		}
	}
	isAttached(): boolean {
		return this._attached;
	}
	detach(): void {
		this._attached = false;
	}
	reattach(): void {
		this._attached = true;
		this.emitChanges();
	}
	emitChanges(propertyKey?: keyof T, propertyValue?: any): void {
		if (propertyKey) {
			super.emit(propertyKey, propertyValue);
			Reflect.deleteProperty(this._marked, propertyKey);
			return;
		}
		const latestChanges = this._marked;
		this._marked = {};
		const keys = this._keys ?? this.getPropertyKeys(latestChanges);
		keys.forEach(propertyKey => {
			this._observer.emit(propertyKey, latestChanges[propertyKey][0], latestChanges[propertyKey][1]);
		});
		keys.length && this._parent?.emit(this._name!, this._ctx);
	}
	detectChanges() {
		this.detach();
		super.detectChanges();
		this.reattach();
	}
	checkNoChanges() {
		this.detach();
		super.detectChanges();
		const keys = Object.keys(this._marked);
		if (keys.length > 0) {
			throw new Error(`Some Changes had been detected`);
		}
	}
	getClass(): TypeOf<ReactiveScopeControl<Context>> {
		return ReactiveScopeControl;
	}
}


interface ImportMeta {
	url: URL;
	/**
	 *
	 * Provides a module-relative resolution function scoped to each module, returning
	 * the URL string.
	 *
	 * @param specified The module specifier to resolve relative to `parent`.
	 * @param parent The absolute parent module URL to resolve from. If none
	 * is specified, the value of `import.meta.url` is used as the default.
	 */
	resolve?(specified: string, parent?: string | URL): Promise<string>;
}

export interface ModuleImport {
	meta: ImportMeta
}

export interface ModuleContext extends Context {
	import: ModuleImport & ((path: string) => Promise<any>);
}

export class ModuleScope extends ReactiveScope<ModuleContext> {
	constructor(context: ModuleContext, propertyKeys?: (keyof ModuleContext)[]) {
		super(context, propertyKeys);
	}
	importModule(propertyKey: keyof ModuleContext, scope: ModuleScope): void {
		this._inners.set(propertyKey, scope);
	}
}
export class WebModuleScope extends ModuleScope {
	constructor() {
		super({} as ModuleContext);
	}
	updateContext(context: any) {
		this._ctx = context;
	}
}
