import type { CanDeclareExpression } from '../api/expression.js';
import { ReactiveScope, ReactiveScopeControl, Scope, ScopeContext, ScopeType } from './scope.js';


export interface AwaitPromiseInfo {
	promise: Promise<any>;
	node: CanDeclareExpression;

	declareVariable: boolean;
	scopeType: ScopeType;
}

export interface AsyncIterableInfo {
	iterable: AsyncIterable<any>;
	forAwaitBody: (iterator: any) => any;
}

export interface Stack {
	/**
	 * a list of promises to resolve in an 'async' scope as 'async function'
	 */
	awaitPromise: Array<AwaitPromiseInfo>;

	/**
	 * resolve await promise in 'await for in' scope
	 */
	forAwaitAsyncIterable?: AsyncIterableInfo;

	/**
	 * is this stack has a propertyKey
	 * @param propertyKey 
	 */
	has(propertyKey: PropertyKey): boolean;

	/**
	 * get the first value for provided property key,
	 * 
	 * will search current stack in all scope till find the first key, else undefined
	 * @param propertyKey 
	 */
	get(propertyKey: PropertyKey): any;

	/**
	 * set the value of `propertyKey` in its context provider with `value`.
	 * else define it in the first scope 'local scope'
	 * @param propertyKey 
	 * @param value 
	 * @param receiver 
	 */
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean;

	/**
	 * declare variable in stack by scope type,
	 * 
	 * 'block' for the first scop ==> may be 'block' or 'function' scope
	 * 
	 * 'function' will search for the first scope with scope type 'function'
	 *  then define a property key with 'initial' value in thus scope
	 * @param scopeType  "function" | "block"
	 * @param propertyKey the name of property mey be string | number | symbol, 
	 * @param propertyValue if not exist will be initialize with 'undefined' value
	 */
	declareVariable(scopeType: ScopeType, propertyKey: PropertyKey, propertyValue?: any): any;


	/**
	 * get context object of this provider,
	 * search for the first context object that has `propertyKey`.
	 * 
	 * search for the first context that have property key,
	 * if not found will return the stack local scop as a default value
	 * @param propertyKey the property key
	 */
	findScope<T extends ScopeContext>(propertyKey: PropertyKey): Scope<T>;

	resolveAwait(value: AwaitPromiseInfo): void;

	/**
	 * get a reference to the last scope in this stack
	 */
	lastScope<T extends ScopeContext>(): Scope<T>;

	/**
	 * clear every thing after this scope, and even this scope
	 * @param scope 
	 */
	clearTo<T extends ScopeContext>(scope: Scope<T>): boolean;

	/**
	 * clear every thing after this scope, but not this scope
	 * @param scope 
	 */
	clearTill<T extends ScopeContext>(scope: Scope<T>): boolean;

	popScope<T extends ScopeContext>(): Scope<T>;

	removeScope<T extends ScopeContext>(scope: Scope<T>): void;

	pushScope<T extends ScopeContext>(scope: Scope<T>): void;

	pushBlockScope<T extends ScopeContext>(): Scope<T>;

	pushFunctionScope<T extends ScopeContext>(): Scope<T>;

	pushBlockScopeFor<T extends ScopeContext>(context: T): Scope<T>;

	pushFunctionScopeFor<T extends ScopeContext>(context: T): Scope<T>;

	pushBlockReactiveScope<T extends ScopeContext>(): ReactiveScope<T>;

	pushFunctionReactiveScope<T extends ScopeContext>(): ReactiveScope<T>;

	pushBlockReactiveScopeFor<T extends ScopeContext>(context: T): ReactiveScope<T>;

	pushFunctionReactiveScopeFor<T extends ScopeContext>(context: T): ReactiveScope<T>;

	copyStack(): Stack;

	/**
	 * used when want to update ui-view like, you want to replace an array with another 
	 * without reflect changes on view until reattached again.
	 */
	detach(): void;

	/**
	 * apply all the not emitted changes, and continue emit in time.
	 */
	reattach(): void;
}

export class Stack implements Stack {
	static for(...contexts: Scope<ScopeContext>[]): Stack {
		if (contexts.length === 0) {
			return new Stack();
		}
		return new Stack(contexts.map(context => new Scope<ScopeContext>(context, 'global')));
	}
	static forScopes(...scopes: Scope<ScopeContext>[]): Stack {
		if (scopes.length === 0) {
			scopes.push(Scope.functionScope());
		}
		return new Stack(scopes);
	}
	awaitPromise: AwaitPromiseInfo[];
	forAwaitAsyncIterable?: AsyncIterableInfo | undefined;

	protected readonly stack: Array<Scope<any>>;
	protected readonly moduleScope: ReactiveScope<ScopeContext>;
	constructor(globalScope: Scope<ScopeContext>, moduleScope?: ReactiveScope<ScopeContext>);
	constructor(stack: Array<Scope<ScopeContext>>, moduleScope?: ReactiveScope<ScopeContext>);
	constructor(arg0?: Array<Scope<ScopeContext>> | Scope<ScopeContext>, arg1?: ReactiveScope<ScopeContext>) {
		if (Array.isArray(arg0)) {
			this.stack = arg0;
		} else if (typeof arg0 == 'object') {
			this.stack = [arg0];
		} else {
			this.stack = [Scope.functionScope()];
		}
		this.moduleScope = arg1 ?? ReactiveScope.globalScope();
	}
	has(propertyKey: PropertyKey): boolean {
		return this.stack.find(context => context.has(propertyKey)) ? true : false;
	}
	get(propertyKey: PropertyKey) {
		return this.findScope<ScopeContext>(propertyKey).get(propertyKey);
	}
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		return this.findScope<ScopeContext>(propertyKey).set(propertyKey, value, receiver);
	}
	declareVariable(scopeType: ScopeType, propertyKey: PropertyKey, propertyValue?: any) {
		if (scopeType === 'block') {
			return this.lastScope<ScopeContext>().set(propertyKey, propertyValue);
		}
		let lastIndex = this.stack.length;
		while (lastIndex--) {
			const scope = this.stack[lastIndex];
			if (scope.type === scopeType) {
				scope.set(propertyKey, propertyValue);
				break;
			}
		}
	}
	findScope<T extends ScopeContext>(propertyKey: PropertyKey): Scope<T> {
		let lastIndex = this.stack.length;
		while (lastIndex--) {
			const scope = this.stack[lastIndex];
			if (scope.has(propertyKey)) {
				return scope;
			}
		}
		return this.lastScope();
	}
	resolveAwait(value: AwaitPromiseInfo): void {
		this.awaitPromise.push(value);
	}
	popScope<T extends ScopeContext>(): Scope<T> {
		return this.stack.pop()!;
	}
	removeScope<T extends ScopeContext>(scope: Scope<T>): void {
		const index = this.stack.lastIndexOf(scope);
		this.stack.splice(index, 1);
	}
	pushScope<T extends ScopeContext>(scope: Scope<T>): void {
		this.stack.push(scope);
	}
	pushBlockScope<T extends ScopeContext>(): Scope<T> {
		const scope = Scope.blockScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushFunctionScope<T extends ScopeContext>(): Scope<T> {
		const scope = Scope.functionScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushClassScope<T extends ScopeContext>(): Scope<T> {
		const scope = Scope.classScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushModuleScope<T extends ScopeContext>(): Scope<T> {
		const scope = Scope.moduleScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushGlobalScope<T extends ScopeContext>(): Scope<T> {
		const scope = Scope.globalScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushBlockScopeFor<T extends ScopeContext>(context: T): Scope<T> {
		const scope = Scope.blockScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	pushFunctionScopeFor<T extends ScopeContext>(context: T): Scope<T> {
		const scope = Scope.functionScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	pushClassScopeFor<T extends ScopeContext>(context: T): Scope<T> {
		const scope = Scope.classScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	pushModuleScopeFor<T extends ScopeContext>(context: T): Scope<T> {
		const scope = Scope.moduleScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	pushGlobalScopeFor<T extends ScopeContext>(context: T): Scope<T> {
		const scope = Scope.globalScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	pushBlockReactiveScope<T extends ScopeContext>(): ReactiveScope<T> {
		const scope = ReactiveScope.blockScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushFunctionReactiveScope<T extends ScopeContext>(): ReactiveScope<T> {
		const scope = ReactiveScope.functionScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushClassReactiveScope<T extends ScopeContext>(): Scope<T> {
		const scope = ReactiveScope.classScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushModuleReactiveScope<T extends ScopeContext>(): Scope<T> {
		const scope = ReactiveScope.moduleScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushGlobalReactiveScope<T extends ScopeContext>(): Scope<T> {
		const scope = ReactiveScope.globalScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushBlockReactiveScopeFor<T extends ScopeContext>(context: T): ReactiveScope<T> {
		const scope = ReactiveScope.blockScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	pushFunctionReactiveScopeFor<T extends ScopeContext>(context: T): ReactiveScope<T> {
		const scope = ReactiveScope.functionScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	pushClassReactiveScopeFor<T extends ScopeContext>(context: T): Scope<T> {
		const scope = ReactiveScope.classScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	pushModuleReactiveScopeFor<T extends ScopeContext>(context: T): Scope<T> {
		const scope = ReactiveScope.moduleScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	pushGlobalReactiveScopeFor<T extends ScopeContext>(context: T): Scope<T> {
		const scope = ReactiveScope.globalScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	lastScope<T extends ScopeContext>(): Scope<T> {
		return this.stack[this.stack.length - 1];
	}
	clearTo<T extends ScopeContext>(scope: Scope<T>): boolean {
		const index = this.stack.lastIndexOf(scope);
		if (index === -1) {
			return false;
		}
		this.stack.splice(index);
		return true;
	}
	clearTill<T extends ScopeContext>(scope: Scope<T>): boolean {
		const index = this.stack.lastIndexOf(scope);
		if (index === -1) {
			return false;
		}
		this.stack.splice(index + 1);
		return true;
	}
	copyStack(): Stack {
		return new Stack(this.stack.slice());
	}

	detach(): void {
		this.getReactiveScopeControls().forEach(scope => scope.detach());
	}
	reattach(): void {
		this.getReactiveScopeControls().forEach(scope => scope.reattach());
	}
	private getReactiveScopeControls(): ReactiveScopeControl<any>[] {
		return this.stack.filter(scope => scope instanceof ReactiveScopeControl) as ReactiveScopeControl<any>[];
	}
}
