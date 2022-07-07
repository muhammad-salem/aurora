const noop = () => { };
const EMPTY_PAYLOAD = {};

export interface AuroraZoneType {
	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T;
	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined, name?: string | undefined): T;
	runGuarded<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T;
	runOutsideAurora<T>(callback: (...args: any[]) => T): T;
}

export class AuroraZone implements AuroraZoneType {
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

	private _inner: Zone;
	private _outer: Zone;

	constructor() {
		if (typeof Zone == 'undefined') {
			throw new Error(`In this configuration Zone.js is  required`);
		}
		Zone.assertZonePatched();
		this._outer = this._inner = Zone.current;

		if ((Zone as any)['TaskTrackingZoneSpec']) {
			this._inner = this._inner.fork(new ((Zone as any)['TaskTrackingZoneSpec'] as any));
		}
		this._inner = this._inner.fork({
			name: 'aurora',
			properties: { 'aurora-zone': true },
		});
	}

	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
		return this._inner.run(callback, applyThis, applyArgs);
	}

	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T {
		const zone = this._inner;
		const task = zone.scheduleEventTask('AuroraZoneEvent: ' + name, callback, EMPTY_PAYLOAD, noop, noop);
		try {
			return zone.runTask(task, applyThis, applyArgs);
		} finally {
			zone.cancelTask(task);
		}
	}

	runGuarded<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
		return this._inner.runGuarded(callback, applyThis, applyArgs);
	}

	runOutsideAurora<T>(callback: (...args: any[]) => T): T {
		return this._outer.run(callback);
	}

}


export class NoopAuroraZone implements AuroraZoneType {
	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T {
		return callback.apply(applyThis, applyArgs!);
	}
	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined, name?: string | undefined): T {
		return callback.apply(applyThis, applyArgs!);
	}
	runGuarded<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T {
		return callback.apply(applyThis, applyArgs!);
	}
	runOutsideAurora<T>(callback: (...args: any[]) => T): T {
		return callback();
	}
}
