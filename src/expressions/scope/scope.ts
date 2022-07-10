import { TypeOf } from '../api/utils.js';

export type ScopeContext = { [key: PropertyKey]: ScopeContext | any };
export interface Scope<T = ScopeContext> {

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
	getScope<V extends ScopeContext>(propertyKey: keyof T): Scope<V> | undefined;

	/**
	 * get a scope for an object named as `propertyKey` from cache map,
	 * 
	 * if no scope found in the cache, will create a new one, add this one to the map, return a reference.
	 * @param propertyKey
	 */
	getScopeOrCreate<V extends ScopeContext>(propertyKey: keyof T): Scope<V>;

	getClass(): TypeOf<Scope<ScopeContext>>;
}

export class Scope<T extends ScopeContext> implements Scope<T> {
	static for<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new Scope(context, propertyKeys);
	}
	static blockScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new Scope({} as T, propertyKeys);
	}
	protected scopeMap = new Map<keyof T, Scope<any>>();
	protected propertyKeys?: (keyof T)[];
	constructor(protected context: T, propertyKeys?: (keyof T)[]) {
		this.propertyKeys = propertyKeys;
		if (Array.isArray(this.propertyKeys)) {
			this.has = (propertyKey: keyof T): boolean => {
				return this.propertyKeys!.includes(propertyKey);
			};
		}
	}
	get(propertyKey: keyof T): any {
		return Reflect.get(this.context, propertyKey);
	}
	set(propertyKey: keyof T, value: any, receiver?: any): boolean {
		return Reflect.set(this.context, propertyKey, value);
	}
	has(propertyKey: keyof T): boolean {
		return propertyKey in this.context;
	}
	delete(propertyKey: keyof T): boolean {
		return Reflect.deleteProperty(this.context, propertyKey);
	}
	getContext(): T {
		return this.context;
	}
	getScope<V extends ScopeContext>(propertyKey: keyof T): Scope<V> | undefined {
		const scopeContext = this.get(propertyKey);
		let scope = this.scopeMap.get(propertyKey);
		if (scope) {
			scope.context = scopeContext;
			return scope;
		}
		if (typeof scopeContext !== 'object') {
			return;
		}
		scope = new (this.getClass())(scopeContext);
		this.scopeMap.set(propertyKey, scope);
		return scope;
	}
	getScopeOrCreate<V extends ScopeContext>(propertyKey: keyof T): Scope<V> {
		const scopeContext = this.get(propertyKey);
		let scope = this.scopeMap.get(propertyKey);
		if (scope) {
			scope.context = scopeContext;
			return scope;
		}
		scope = new (this.getClass())(scopeContext);
		this.scopeMap.set(propertyKey, scope);
		return scope;
	}
	getClass(): TypeOf<Scope<ScopeContext>> {
		return Scope;
	}
}

export class ReadOnlyScope<T extends ScopeContext> extends Scope<T> {
	static for<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope(context, propertyKeys);
	}
	static blockScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
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
	getClass(): TypeOf<ReadOnlyScope<ScopeContext>> {
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
	private subscribers: Map<keyof T, Map<ScopeSubscription<T>, SubscriptionInfo>> = new Map();
	private propertiesLock: (keyof T)[] = [];
	emit(propertyKey: keyof T, newValue: any, oldValue?: any): void {
		if (this.propertiesLock.includes(propertyKey)) {
			return;
		}
		const subscribers = this.subscribers.get(propertyKey);
		if (!subscribers || subscribers.size == 0) {
			return;
		}
		this.propertiesLock.push(propertyKey);
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
		if (this.propertiesLock.pop() !== propertyKey) {
			console.error('lock error');
		};
	}
	subscribe(propertyKey: keyof T, callback: ValueChangedCallback): ScopeSubscription<T> {
		const subscription: ScopeSubscription<T> = new ScopeSubscription(propertyKey, this);
		let propertySubscribers = this.subscribers.get(propertyKey);
		if (!propertySubscribers) {
			propertySubscribers = new Map();
			this.subscribers.set(propertyKey, propertySubscribers);
		}
		propertySubscribers.set(subscription, { callback, enable: true });
		return subscription;
	}

	unsubscribe(propertyKey: keyof T, subscription?: ScopeSubscription<T>) {
		if (subscription) {
			this.subscribers.get(propertyKey)?.delete(subscription);
		} else {
			this.subscribers.delete(propertyKey);
		}
	}

	pause(propertyKey: keyof T, subscription: ScopeSubscription<T>) {
		const subscriptionInfo = this.subscribers.get(propertyKey)?.get(subscription);
		subscriptionInfo && (subscriptionInfo.enable = false);
	}

	resume(propertyKey: keyof T, subscription: ScopeSubscription<T>) {
		const subscriptionInfo = this.subscribers.get(propertyKey)?.get(subscription);
		subscriptionInfo && (subscriptionInfo.enable = true);
	}

	/**
	 * clear subscription maps
	 */
	destroy() {
		this.subscribers.clear();
	}
}

export class ReactiveScope<T extends ScopeContext> extends Scope<T> {
	static for<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScope(context, propertyKeys);
	}
	static blockScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScope({} as T, propertyKeys);
	}
	protected _clone: T;
	declare protected scopeMap: Map<keyof T, ReactiveScope<any>>;
	protected observer: ValueChangeObserver<T> = new ValueChangeObserver<T>();
	protected name?: string;

	constructor(context: T, propertyKeys?: (keyof T)[]);
	constructor(context: T, name: string, parent: ReactiveScope<any>, propertyKeys?: (keyof T)[]);
	constructor(context: T, name?: string | (keyof T)[], protected parent?: ReactiveScope<any>, propertyKeys?: (keyof T)[]) {
		super(context, Array.isArray(name) ? name : propertyKeys);
		if (typeof name == 'string') {
			this.name = name;
		}
		if (Array.isArray(name)) {
			this.propertyKeys = name;
		}
	}

	set(propertyKey: keyof T, newValue: any, receiver?: any): boolean {
		const oldValue = Reflect.get(this.context, propertyKey);
		const result = Reflect.set(this.context, propertyKey, newValue);
		if (result) {
			this.emit(propertyKey, newValue, oldValue);
		}
		return result;
	}
	delete(propertyKey: keyof T): boolean {
		const oldValue = Reflect.get(this.context, propertyKey);
		const isDelete = Reflect.deleteProperty(this.context, propertyKey);
		if (isDelete && oldValue !== undefined) {
			this.emit(propertyKey, undefined, oldValue);
		}
		return isDelete;
	}
	getScope<V extends ScopeContext>(propertyKey: keyof T): ReactiveScope<V> | undefined {
		const scopeContext = this.get(propertyKey) as V;
		let scope = this.scopeMap.get(propertyKey) as ReactiveScope<any> | undefined;
		if (scope) {
			scope.context = scopeContext;
			return scope;
		}
		if (typeof scopeContext !== 'object') {
			return;
		}
		scope = new ReactiveScope<V>(scopeContext, propertyKey as string, this);
		this.scopeMap.set(propertyKey, scope);
		return scope;
	}
	getScopeOrCreate<V extends ScopeContext>(propertyKey: keyof T): ReactiveScope<V> {
		const scopeContext = this.get(propertyKey) as V;
		let scope = this.scopeMap.get(propertyKey) as ReactiveScope<any> | undefined;
		if (scope) {
			scope.context = scopeContext;
			return scope;
		}
		scope = new ReactiveScope<V>(scopeContext, propertyKey as string, this);
		this.scopeMap.set(propertyKey, scope);
		return scope;
	}
	emit(propertyKey: keyof T, newValue: any, oldValue?: any): void {
		this.observer.emit(propertyKey, newValue, oldValue);
		this.parent?.emit(this.name!, this.context);
	}
	subscribe(propertyKey: keyof T, callback: ValueChangedCallback): ScopeSubscription<T> {
		return this.observer.subscribe(propertyKey, callback);
	}
	unsubscribe(propertyKey?: keyof T, subscription?: ScopeSubscription<T>) {
		if (propertyKey && subscription) {
			this.observer.unsubscribe(propertyKey, subscription);
		} else if (propertyKey) {
			this.observer.unsubscribe(propertyKey);
		} else {
			this.observer.destroy();
		}
	}
	clone() {
		if (this.context instanceof HTMLElement) {
			return;
		}
		const clone = Object.assign({}, this.context);
		this._clone = clone;
		const currentKeys = Object.keys(this._clone) as (keyof T)[];
		currentKeys
			.filter(key => typeof clone[key] === 'object')
			.map(key => this.getScope(key))
			.filter(scope => !!scope)
			.forEach(scope => scope!.clone());
	}
	clearClone() {
		Reflect.deleteProperty(this, '_clone');
		this.scopeMap.forEach(scope => scope.clearClone());
	}
	detectChanges() {
		const previous = this._clone;
		this.clone();
		const current = this._clone;
		if ((!!!previous && !!current) || (!!previous && !!!current)) {
			this.parent?.emit(this.name!, this.context);
			return;
		}
		const previousKeys = previous ? Object.keys(previous) as (keyof T)[] : [];
		const currentKeys = current ? Object.keys(current) as (keyof T)[] : [];

		const keys = new Set([...previousKeys, ...currentKeys]);
		keys.forEach(key => {
			if (previous[key] == current[key]) {
				return;
			}
			if (this.scopeMap.has(key)) {
				const scope = this.scopeMap.get(key)!;
				scope.context = current[key];
				scope.detectChanges();
			} else {
				this.emit(key, this.context[key], previous[key]);
			}
		});
		this.clearClone();
	}
	getClass(): TypeOf<ReactiveScope<ScopeContext>> {
		return ReactiveScope;
	}
}

/**
 * used control/notify/pause scope about changes in current context
 */
export interface ScopeControl<T extends ScopeContext> {

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
}

export class ReactiveScopeControl<T extends ScopeContext> extends ReactiveScope<T> implements ScopeControl<T> {
	static for<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl(context, propertyKeys);
	}
	static blockScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl({} as T, propertyKeys);
	}

	protected attached: boolean = true;
	protected marked: ScopeContext = {};
	override emit(propertyKey: keyof T, newValue: any, oldValue?: any): void {
		if (this.attached) {
			super.emit(propertyKey, newValue, oldValue);
		} else {
			this.marked[propertyKey] = newValue;
		}
	}
	isAttached(): boolean {
		return this.attached;
	}
	detach(): void {
		this.attached = false;
	}
	reattach(): void {
		this.attached = true;
		this.emitChanges();
	}
	emitChanges(propertyKey?: keyof T, propertyValue?: any): void {
		if (propertyKey) {
			super.emit(propertyKey, propertyValue);
			Reflect.deleteProperty(this.marked, propertyKey);
			return;
		}
		const latestChanges = this.marked;
		this.marked = {};
		Object.keys(latestChanges).forEach(propertyKey => {
			super.emit(propertyKey, latestChanges[propertyKey]);
		});
	}
	detectChanges() {
		this.detach();
		super.detectChanges();
		this.reattach();
	}
	getClass(): TypeOf<ReactiveScopeControl<ScopeContext>> {
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

export interface ModuleContext extends ScopeContext {
	import: ModuleImport & ((path: string) => Promise<any>);
}

export class ModuleScope extends ReactiveScope<ModuleContext> {
	constructor(context: ModuleContext, propertyKeys?: (keyof ModuleContext)[]) {
		super(context, propertyKeys);
	}
	importModule(propertyKey: keyof ModuleContext, scope: ModuleScope): void {
		this.scopeMap.set(propertyKey, scope);
	}
}
export class WebModuleScope extends ModuleScope {
	constructor() {
		super({} as ModuleContext);
	}
	updateContext(context: any) {
		this.context = context;
	}
}
