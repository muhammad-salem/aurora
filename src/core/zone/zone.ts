/// <reference types='zone.js' />
import { EventEmitter } from '../component/events.js';
import { ZoneType } from './bootstrap.js';

const NOOP = () => { };
const EMPTY_PAYLOAD = {};

export interface AuroraZone {

	readonly onTry: EventEmitter<void>;
	readonly onCatch: EventEmitter<void>;
	readonly onFinal: EventEmitter<void>;
	readonly onEmpty: EventEmitter<void>;


	fork(type?: ZoneType): AuroraZone;
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
	abstract fork(type?: ZoneType): AuroraZone;

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
	fork(type?: ZoneType): AuroraZone {
		if (type === 'manual') {
			return new ManualAuroraZone(this);
		} else if (type === 'proxy') {
			return new ProxyAuroraZone(this);
		}
		return new AuroraZone(this);
	}
	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
		return (this as any as AuroraZonePrivate)._inner.run(callback, applyThis, applyArgs);
	}

	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T {
		const zone = (this as any as AuroraZonePrivate)._inner;
		const task = zone.scheduleEventTask('AuroraZoneEvent: ' + name ?? '', callback, EMPTY_PAYLOAD, NOOP, NOOP);
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

export class ManualAuroraZone extends AbstractAuroraZone {

	constructor(parent?: AuroraZone) {
		super();
		if (parent) {
			const self = this as any as AuroraZonePrivate;
			self._nesting = 0;
			self._parent = parent as AuroraZonePrivate;
		}
	}
	fork(type?: ZoneType): AuroraZone {
		if (type === 'proxy') {
			return new ProxyAuroraZone(this);
		} else if (type === 'aurora') {
			return new AuroraZone(this);
		}
		return new ManualAuroraZone(this);
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

export class ProxyAuroraZone extends AbstractAuroraZone {

	private _cdPromise?: Promise<void>

	constructor(parent?: AuroraZone) {
		super();
		if (parent) {
			const self = this as any as AuroraZonePrivate;
			self._nesting = 0;
			self._parent = parent as AuroraZonePrivate;
		}
	}
	fork(type?: ZoneType): AuroraZone {
		if (type === 'manual') {
			return new ManualAuroraZone(this);
		} else if (type === 'aurora') {
			return new AuroraZone(this);
		}
		return new ProxyAuroraZone(this);
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
	scheduleChangesDetection() {
		this._cdPromise ??= Promise
			.resolve()
			.then(() => {
				this.runCallback(NOOP);
				this._cdPromise = undefined;
			});
	}
}
