import type { DeclarationExpression } from '../api/expression.js';
import { LanguageMode } from '../v8/language.js';
import { JavaScriptParser } from '../v8/parser.js';
import { finalizerRegister } from './finalizer.js';
import {
	ModuleContext, ModuleImport, ModuleScope, ReactiveScope,
	ReactiveControlScope, Scope, Context, WebModuleScope
} from './scope.js';


export interface AwaitPromiseInfo {
	promise: Promise<any>;
	node: DeclarationExpression;

	declareVariable: boolean;
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
	 * declare variable at last scope in the stack,
	 * 
	 * @param propertyKey the name of property mey be string | number | symbol, 
	 * @param propertyValue if not exist will be initialize with 'undefined' value
	 */
	declareVariable(propertyKey: PropertyKey, propertyValue?: any): any;


	/**
	 * get context object of this provider,
	 * search for the first context object that has `propertyKey`.
	 * 
	 * search for the first context that have property key,
	 * if not found will return the stack local scop as a default value
	 * @param propertyKey the property key
	 */
	findScope<T extends Context>(propertyKey: PropertyKey): Scope<T>;

	resolveAwait(value: AwaitPromiseInfo): void;

	/**
	 * get a reference to the last scope in this stack
	 */
	lastScope<T extends Context>(): Scope<T>;

	/**
	 * clear every thing after this scope, and even this scope
	 * @param scope 
	 */
	clearTo<T extends Context>(scope: Scope<T>): boolean;

	/**
	 * clear every thing after this scope, but not this scope
	 * @param scope 
	 */
	clearTill<T extends Context>(scope: Scope<T>): boolean;

	popScope<T extends Context>(): Scope<T>;

	removeScope<T extends Context>(scope: Scope<T>): void;

	pushScope<T extends Context>(scope: Scope<T>): void;

	pushBlockScope<T extends Context>(): Scope<T>;

	pushBlockScopeFor<T extends Context>(context: T): Scope<T>;

	pushReactiveScope<T extends Context>(): ReactiveScope<T>;

	pushReactiveScopeFor<T extends Context>(context: T): ReactiveScope<T>;

	/**
	 * create new stack instance with the same reference to the current scope array
	 */
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

	/**
	 * import module scope from another stack, by the help of ModuleScopeResolver.
	 * 
	 * used with import statement
	 */
	importModule(source: string, importCallOptions?: ImportCallOptions): ModuleScope;

	/**
	 * get the current module for this stack.
	 * 
	 * used with export statement
	 */
	getModule(): ModuleScope | undefined;

	/**
	 * register action to do on destroy this stack
	 */
	onDestroy(action: () => void): void;
}

export class Stack implements Stack {
	static for(...contexts: Context[]): Stack {
		if (contexts.length === 0) {
			return new Stack();
		}
		return new Stack(contexts.map(context => new Scope<Context>(context)));
	}
	static forScopes(...scopes: Scope<Context>[]): Stack {
		if (scopes.length === 0) {
			scopes.push(Scope.blockScope());
		}
		return new Stack(scopes);
	}
	static moduleScope(resolver: ModuleScopeResolver, moduleSource: string, ...globalScopes: Scope<Context>[]) {
		return new Stack(globalScopes, resolver, moduleSource);
	}
	awaitPromise: AwaitPromiseInfo[] = [];
	forAwaitAsyncIterable?: AsyncIterableInfo | undefined;

	protected readonly stack: Array<Scope<any>>;
	protected readonly moduleScope?: ModuleScope;
	protected readonly moduleSource?: string;
	protected readonly resolver?: ModuleScopeResolver;

	protected readonly onDestroyActions: (() => void)[] = [];

	constructor();
	constructor(globalScope: Scope<Context>);
	constructor(globalScope: Scope<Context>, resolver: ModuleScopeResolver, moduleSource: string);

	constructor(stack: Array<Scope<Context>>);
	constructor(stack: Array<Scope<Context>>, resolver: ModuleScopeResolver, moduleSource: string);

	constructor(stack: Stack);
	constructor(stack: Stack, resolver: ModuleScopeResolver, moduleSource: string);

	constructor(globals?: Stack | Array<Scope<Context>> | Scope<Context>, resolver?: ModuleScopeResolver, moduleSource?: string) {
		if (Array.isArray(globals)) {
			this.stack = globals.slice();
		} else if (globals instanceof Stack) {
			this.stack = globals.stack.slice();
		} else if (typeof globals == 'object') {
			this.stack = [globals];
		} else {
			this.stack = [];
		}
		if (resolver && moduleSource) {
			this.resolver = resolver;
			this.moduleSource = moduleSource;
			// init module scope for import and export
			this.moduleScope = new ModuleScope(this.initModuleContext());
			this.pushScope(this.moduleScope);
			// for the rest of module body
			this.pushReactiveScope();
		} else if (this.stack.length === 0) {
			// not a module scope
			this.pushBlockScope();
		}
		finalizerRegister(this, this.onDestroyActions, this);
	}
	private initModuleContext(): ModuleContext {
		const importFunc = (path: string) => {
			const module = this.importModule(path);
			if (module instanceof WebModuleScope) {
				return module.resolveImport();
			}
			return Promise.resolve(module.getContext());
		};
		importFunc.meta = {
			url: createRootURL(this.moduleSource!),
			resolve: (specified: string, parent?: string | URL): Promise<string> => {
				return Promise.resolve(this.resolver!.resolveURL(specified, parent ?? importFunc.meta.url));
			}
		};
		const im: ModuleImport & ((path: string) => Promise<any>) = importFunc as any;
		return { import: im };
	}
	has(propertyKey: PropertyKey): boolean {
		return this.stack.find(context => context.has(propertyKey)) ? true : false;
	}
	get(propertyKey: PropertyKey) {
		return this.findScope<Context>(propertyKey).get(propertyKey);
	}
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		return this.findScope<Context>(propertyKey).set(propertyKey, value, receiver);
	}
	declareVariable(propertyKey: PropertyKey, propertyValue?: any) {
		return this.lastScope<Context>().set(propertyKey, propertyValue);
	}
	findScope<T extends Context>(propertyKey: PropertyKey): Scope<T> {
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
	popScope<T extends Context>(): Scope<T> {
		return this.stack.pop()!;
	}
	removeScope<T extends Context>(scope: Scope<T>): void {
		const index = this.stack.lastIndexOf(scope);
		this.stack.splice(index, 1);
	}
	pushScope<T extends Context>(scope: Scope<T>): void {
		this.stack.push(scope);
	}
	pushBlockScope<T extends Context>(propertyKeys?: (keyof T)[]): Scope<T> {
		const scope = Scope.blockScope<T>(propertyKeys);
		this.stack.push(scope);
		return scope;
	}
	pushBlockScopeFor<T extends Context>(context: T, propertyKeys?: (keyof T)[]): Scope<T> {
		const scope = Scope.for<T>(context, propertyKeys);
		this.stack.push(scope);
		return scope;
	}
	pushReactiveScope<T extends Context>(propertyKeys?: (keyof T)[]): ReactiveScope<T> {
		const scope = ReactiveScope.blockScope<T>(propertyKeys);
		this.stack.push(scope);
		return scope;
	}
	pushReactiveScopeFor<T extends Context>(context: T, propertyKeys?: (keyof T)[]): ReactiveScope<T> {
		const scope = ReactiveScope.for(context, propertyKeys);
		this.stack.push(scope);
		return scope;
	}
	lastScope<T extends Context>(): Scope<T> {
		return this.stack[this.stack.length - 1];
	}
	clearTo<T extends Context>(scope: Scope<T>): boolean {
		const index = this.stack.lastIndexOf(scope);
		if (index === -1) {
			return false;
		}
		this.stack.splice(index);
		return true;
	}
	clearTill<T extends Context>(scope: Scope<T>): boolean {
		const index = this.stack.lastIndexOf(scope);
		if (index === -1) {
			return false;
		}
		this.stack.splice(index + 1);
		return true;
	}
	copyStack(): Stack {
		return new Stack(this.stack.slice(), this.resolver!, this.moduleSource!);
	}
	detach(): void {
		this.getReactiveScopeControls().forEach(scope => scope.detach());
	}
	reattach(): void {
		this.getReactiveScopeControls().forEach(scope => scope.reattach());
	}
	detectChanges() {
		this.getReactiveScope().forEach(scope => scope.detectChanges());
	}
	private getReactiveScopeControls(): ReactiveControlScope<any>[] {
		return this.stack.filter(scope => scope instanceof ReactiveControlScope) as ReactiveControlScope<any>[];
	}
	private getReactiveScope(): ReactiveScope<any>[] {
		return this.stack.filter(scope => scope instanceof ReactiveScope) as ReactiveScope<any>[];
	}
	importModule(source: string, importCallOptions?: ImportCallOptions): ModuleScope {
		if (!this.resolver || !this.moduleScope) {
			// should o the parse and import the module
			throw new Error('Module Resolver is undefined');
		}
		return this.resolver.resolve(source, this.moduleScope, importCallOptions);
	}
	getModule(): ModuleScope | undefined {
		return this.moduleScope;
	}

	onDestroy(action: () => void): void {
		this.onDestroyActions.push(action);
	}
}


export interface ModuleScopeResolver {
	resolve(source: string, moduleScope: ModuleScope, importCallOptions?: ImportCallOptions): ModuleScope;
	resolveURL(specified: string, parent: string | URL): string;
}

const ROOT_URL = 'https://root';
export function createRootURL(source: string): URL {
	return new URL(source, ROOT_URL);
}


export interface ResolverConfig {
	/**
	 * allow import modules from external http(s) module
	 */
	allowImportExternal?: boolean;

};

/**
 * file system provider
 */
export interface ModuleSourceProvider {
	[url: string]: string;
}

export class ModuleScopeResolver implements ModuleScopeResolver {
	protected modules: [string, ModuleScope][] = [];

	constructor(protected globalStack: Stack, protected provider: ModuleSourceProvider, protected config?: ResolverConfig) { }
	private register(source: string, moduleScope: ModuleScope) {
		const stackInfo = this.modules.find(tuple => tuple[0] == source && tuple[1] == moduleScope);
		if (stackInfo) {
			stackInfo[1] = moduleScope;
		} else {
			this.modules.push([source, moduleScope]);
		}
	}
	resolve(source: keyof ModuleSourceProvider): ModuleScope;
	resolve(source: keyof ModuleSourceProvider, moduleScope: ModuleScope, importCallOptions?: ImportCallOptions): ModuleScope;
	resolve(source: string, moduleScope?: ModuleScope, importCallOptions?: ImportCallOptions): ModuleScope {
		if (this.isValidHTTPUrl(source)) {
			return this.resolveExternalModule(source, importCallOptions);
		}
		if (source.startsWith('/')) {
			return this.findScopeBySource(source, importCallOptions);
		}
		const currentSource = this.findSourceByScope(moduleScope!);
		const absoluteUrl = this.resolveURL(source, currentSource);
		return this.findScopeBySource(absoluteUrl, importCallOptions);
	}
	resolveURL(specified: string, parent: string | URL): string {
		const currentUrl = parent instanceof URL ? parent.href : createRootURL(parent).href;
		const importedUrl = new URL(specified, currentUrl).href;
		const absoluteUrl = importedUrl.replace(ROOT_URL, '');
		return absoluteUrl;
	}
	protected findScopeBySource(source: string, importCallOptions?: ImportCallOptions): ModuleScope {
		if (importCallOptions?.assert?.type) {
			const type = importCallOptions.assert.type;
			if (!source.endsWith(`.${type}`)) {
				throw new Error(`Can't find module scope`);
			}
		}
		const importedScope = this.modules.find(tuple => tuple[0] == source)?.[1];
		if (!importedScope) {
			// search in the file system provider
			const javascriptSource = this.provider[source];
			if (javascriptSource || javascriptSource == '') {
				// module exists
				const moduleProgram = JavaScriptParser.parse(javascriptSource, { mode: LanguageMode.Strict });
				const stack = new Stack(this.globalStack, this, source);
				// register with absoluteUrl
				this.register(source, stack.getModule()!);
				moduleProgram.get(stack);
				return stack.getModule()!;
			}
			throw new Error(`Can't find module scope`);
		}
		return importedScope;
	}
	protected findSourceByScope(moduleScope: ModuleScope): string {
		const importedSource = this.modules.find(tuple => tuple[1] == moduleScope)?.[0];
		if (!importedSource) {
			throw new Error(`Can't resolve scope source`);
		}
		return importedSource;
	}
	protected resolveExternalModule(source: string, importCallOptions?: ImportCallOptions): WebModuleScope {
		if (!this.config?.allowImportExternal) {
			throw new Error(`Error: Import External Module is not allowed.`);
		}
		const webScope = new WebModuleScope(source, importCallOptions);
		this.modules.push([source, webScope]);
		return webScope;
	}
	protected readonly isValidHTTPUrl = (string: string) => {
		let url: URL;
		try {
			url = new URL(string);
		} catch (e) {
			return false;
		}
		return url.protocol === 'http:' || url.protocol === 'https:';
	}
}
