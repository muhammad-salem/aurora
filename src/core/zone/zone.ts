/// <reference types='zone.js' />
import { EventEmitter } from '../component/events.js';

const noop = () => { };
const EMPTY_PAYLOAD = {};

export interface AuroraZone {

	readonly onTry: EventEmitter<void>;
	readonly onCatch: EventEmitter<void>;
	readonly onFinal: EventEmitter<void>;

	fork(): AuroraZone;
	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T;
	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined, name?: string | undefined): T;
	runGuarded<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T;
	runOutsideAurora<T>(callback: (...args: any[]) => T): T;
}

let LastId = 0;

abstract class AbstractAuroraZone {
	readonly onTry: EventEmitter<void> = new EventEmitter<void>();
	readonly onCatch: EventEmitter<void> = new EventEmitter<void>();
	readonly onFinal: EventEmitter<void> = new EventEmitter<void>();
	private id: number;
	constructor() {
		this.id = ++LastId;
	}
}

export class AuroraZone extends AbstractAuroraZone implements AuroraZone {
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

	constructor() {
		if (typeof Zone == 'undefined') {
			throw new Error(`In this configuration Zone.js is  required`);
		}
		Zone.assertZonePatched();
		super();
		const self = this as any as AuroraZonePrivate;
		self._outer = Zone.root;
		self._inner = Zone.current;
		if ((Zone as any)['TaskTrackingZoneSpec']) {
			self._inner = self._inner.fork(new ((Zone as any)['TaskTrackingZoneSpec'] as any));
		}
		self._inner = self._inner.fork({
			name: 'aurora',
			properties: { 'aurora-zone': true },
			onInvoke: (parentZoneDelegate, currentZone, targetZone, delegate, applyThis, applyArgs?, source?) => {
				try {
					this.onTry.emit();
					return parentZoneDelegate.invoke(targetZone, delegate, applyThis, applyArgs, source);
				} finally {
					this.onFinal.emit();
				}
			},
			onInvokeTask: (parentZoneDelegate, currentZone, targetZone, task, applyThis, applyArgs?) => {
				try {
					this.onTry.emit();
					return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
				} finally {
					this.onFinal.emit();
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
		return new AuroraZone();
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
}


export class NoopAuroraZone extends AbstractAuroraZone implements AuroraZone {

	readonly onTry: EventEmitter<void> = new EventEmitter<void>();
	readonly onFinal: EventEmitter<void> = new EventEmitter<void>();
	readonly onCatch: EventEmitter<void> = new EventEmitter<void>();

	fork(): AuroraZone {
		return new NoopAuroraZone();
	}

	private runCallback<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T {
		try {
			this.onTry.emit();
			return callback.apply(applyThis, applyArgs!);
		} catch (error) {
			this.onCatch.emit();
			throw error;
		} finally {
			this.onFinal.emit();
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
