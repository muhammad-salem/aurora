/// <reference types='zone.js' />
import { EventEmitter } from '../component/events.js';
import { createZoneProxyHandler } from './proxy.js';

const noop = () => { };
const EMPTY_PAYLOAD = {};

export interface AuroraZone {

	readonly onTry: EventEmitter<void>;
	readonly onCatch: EventEmitter<void>;
	readonly onFinal: EventEmitter<void>;
	readonly onEmpty: EventEmitter<void>;


	fork(): AuroraZone;
	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T;
	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined, name?: string | undefined): T;
	runGuarded<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T;
	runOutsideAurora<T>(callback: (...args: any[]) => T): T;
}

let LastId = 0;

export abstract class AbstractAuroraZone implements AuroraZone {
	readonly onTry: EventEmitter<void> = new EventEmitter<void>();
	readonly onCatch: EventEmitter<void> = new EventEmitter<void>();
	readonly onFinal: EventEmitter<void> = new EventEmitter<void>();
	readonly onEmpty: EventEmitter<void> = new EventEmitter<void>();
	protected id: number;
	constructor() {
		this.id = ++LastId;
	}
	abstract fork(): AuroraZone;
	abstract run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T;
	abstract runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined, name?: string | undefined): T;
	abstract runGuarded<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T;
	abstract runOutsideAurora<T>(callback: (...args: any[]) => T): T;
}

export class AuroraZone extends AbstractAuroraZone {
	static isInAuroraZone(): boolean {
		return typeof Zone !== 'undefined' && Zone.current.get('aurora-zone') === true;
	}

	static assertInAuroraZone(): void {
		if (!AuroraZone.isInAuroraZone()) {
			throw new Error('Expected to be in Aurora Zone, but it is not!');
		}
	}

	static assertNotInAuroraZone(): void {
		if (AuroraZone.isInAuroraZone()) {
			throw new Error('Expected to not be in Aurora Zone, but it is!');
		}
	}

	constructor(parent?: AuroraZone) {
		if (typeof Zone == 'undefined') {
			throw new Error(`In this configuration Zone.js is  required`);
		}
		Zone.assertZonePatched();
		super();
		const self = this as any as AuroraZonePrivate;
		self._nesting = 0;
		self._outer = Zone.root;
		if (parent) {
			self._parent = (parent as AuroraZonePrivate);
			self._inner = (parent as AuroraZonePrivate)._inner;
		} else {
			self._inner = Zone.current;
			if ((Zone as any)['TaskTrackingZoneSpec']) {
				self._inner = self._inner.fork(new ((Zone as any)['TaskTrackingZoneSpec'] as any));
			}
		}
		self._inner = self._inner.fork({
			name: 'aurora',
			properties: { 'aurora-zone': true, id: self.id },
			onInvoke: (parentZoneDelegate, currentZone, targetZone, delegate, applyThis, applyArgs?, source?) => {
				try {
					before(self);
					return parentZoneDelegate.invoke(targetZone, delegate, applyThis, applyArgs, source);
				} finally {
					after(self);
				}
			},
			onInvokeTask: (parentZoneDelegate, currentZone, targetZone, task, applyThis, applyArgs?) => {
				try {
					before(self);
					return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
				} finally {
					after(self);
				}
			},
			onHandleError: (parentZoneDelegate, currentZone, targetZone, error) => {
				parentZoneDelegate.handleError(targetZone, error);
				self.runOutsideAurora(() => self.onCatch.emit(error));
				return false;
			},
		});
	}
	fork(): AuroraZone {
		return new AuroraZone(this);
	}
	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
		return (this as any as AuroraZonePrivate)._inner.run(callback, applyThis, applyArgs);
	}

	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T {
		const zone = (this as any as AuroraZonePrivate)._inner;
		const task = zone.scheduleEventTask('AuroraZoneEvent: ' + name ?? '', callback, EMPTY_PAYLOAD, noop, noop);
		try {
			return zone.runTask(task, applyThis, applyArgs);
		} finally {
			zone.cancelTask(task);
		}
	}
	runGuarded<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
		return (this as any as AuroraZonePrivate)._inner.runGuarded(callback, applyThis, applyArgs);
	}
	runOutsideAurora<T>(callback: (...args: any[]) => T): T {
		return (this as any as AuroraZonePrivate)._outer.run(callback);
	}
}

interface AuroraZonePrivate extends AuroraZone {
	_inner: Zone;
	_outer: Zone;
	_nesting: number;
	_parent: AuroraZonePrivate;
}

function before(zone: AuroraZonePrivate) {
	zone.onTry.emit();
	zone._nesting++;
}

function after(zone: AuroraZonePrivate) {
	zone._nesting--;
	zone.onFinal.emit();
	if (zone._nesting === 0) {
		zone.onEmpty.emit();
	}
}

export class NoopAuroraZone extends AbstractAuroraZone {

	constructor(parent?: AuroraZone) {
		super();
		if (parent) {
			const self = this as any as AuroraZonePrivate;
			self._nesting = 0;
			self._parent = parent as AuroraZonePrivate;
		}
	}
	fork(): AuroraZone {
		return new NoopAuroraZone(this);
	}
	private runCallback<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T {
		try {
			before(this as any as AuroraZonePrivate);
			return callback.apply(applyThis, applyArgs!);
		} catch (error) {
			this.onCatch.emit();
			throw error;
		} finally {
			after(this as any as AuroraZonePrivate);
		}
	}
	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T {
		return this.runCallback(callback, applyThis, applyArgs);
	}
	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined, name?: string | undefined): T {
		return this.runCallback(callback, applyThis, applyArgs);
	}
	runGuarded<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T {
		return this.runCallback(callback, applyThis, applyArgs);
	}
	runOutsideAurora<T>(callback: (...args: any[]) => T): T {
		return callback();
	}
}

const ReflectInterceptors = [Reflect.defineProperty, Reflect.deleteProperty, Reflect.get, Reflect.set];

export class ProxyAuroraZone extends AbstractAuroraZone {

	constructor(parent?: AuroraZone) {
		super();
		if (parent) {
			const self = this as any as AuroraZonePrivate;
			self._nesting = 0;
			self._parent = parent as AuroraZonePrivate;
		}
	}
	fork(): AuroraZone {
		return new ProxyAuroraZone(this);
	}
	private runCallback<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T {
		try {
			before(this as any as AuroraZonePrivate);
			if (ReflectInterceptors.includes(callback)) {
				return callback.apply(void 0, applyArgs!);
			} else if (applyThis) {
				const proxy = createZoneProxyHandler(applyThis, this);
				return callback.apply(proxy, applyArgs!);
			} else {
				return callback.apply(applyThis, applyArgs!);
			}
		} catch (error) {
			this.onCatch.emit();
			throw error;
		} finally {
			after(this as any as AuroraZonePrivate);
		}
	}
	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T {
		return this.runCallback(callback, applyThis, applyArgs);
	}
	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined, name?: string | undefined): T {
		return this.runCallback(callback, applyThis, applyArgs);
	}
	runGuarded<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T {
		return this.runCallback(callback, applyThis, applyArgs);
	}
	runOutsideAurora<T>(callback: (...args: any[]) => T): T {
		return callback();
	}
}
