/// <reference types='zone.js' />
import { ReactiveScopeControl, ScopeContext, Stack } from '@ibyar/expressions';
import { ScopeTask, StackTask } from './task.js';

const noop = () => { };
const EMPTY_PAYLOAD = {};

export interface AuroraZone {
	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T;
	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined, name?: string | undefined): T;
	runScopeTask<T>(scope: ReactiveScopeControl<any>, callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T;
	runStackTask<T>(stack: Stack, callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T;
	runGuarded<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T;
	runOutsideAurora<T>(callback: (...args: any[]) => T): T;
}

export class AuroraZone implements AuroraZone {
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
		const self = this as any as AuroraZonePrivate;

		self._outer = self._inner = Zone.current;

		if ((Zone as any)['TaskTrackingZoneSpec']) {
			self._inner = self._inner.fork(new ((Zone as any)['TaskTrackingZoneSpec'] as any));
		}
		const ref: { clone: () => void, detectChanges: () => void, }[] = [];
		self._inner = self._inner.fork({
			name: 'aurora',
			properties: { 'aurora-zone': true },
			onScheduleTask: (parentZoneDelegate, currentZone, targetZone, task) => {
				console.log('onScheduleTask', targetZone.name, task.callback.toString().split('\n').slice(0, 2));
				if (task instanceof ScopeTask) {
					ref.push(task.scope)
				}
				else if (task instanceof StackTask) {
					ref.push(task.stack);
				} else {
					const last = ref.at(-1);
					const invoke = task.invoke;

					task.invoke = function (...args: any[]) {
						try {
							last?.clone();
							invoke.apply(this, args);
						} finally {
							console.log('detectChanges', last);
							last?.detectChanges();
						}
					};
				}
				return parentZoneDelegate.scheduleTask(targetZone, task);
			},
			// onHasTask: (parentZoneDelegate, currentZone, targetZone, hasTaskState) => {
			// 	console.log('onHasTask', parentZoneDelegate.zone.name, currentZone.name, targetZone.name, hasTaskState);
			// },
			// onInvokeTask: (parentZoneDelegate, currentZone, targetZone, task, applyThis, applyArgs?) => {
			// 	console.log('onInvokeTask', task.callback.toString().split('\n').slice(0, 2));
			// 	return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
			// },
			onCancelTask: (parentZoneDelegate, currentZone, targetZone, task) => {
				console.log('onCancelTask', targetZone.name, task.callback.toString().split('\n').slice(0, 2));
				let index: number = -1;
				if (task instanceof ScopeTask) {
					index = ref.indexOf(task.scope);
				}
				else if (task instanceof StackTask) {
					index = ref.indexOf(task.stack);
				}
				if (index !== -1) {
					ref.splice(index, 1);
				}
				return parentZoneDelegate.cancelTask(targetZone, task);
			},
		});
	}

	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
		return (this as any as AuroraZonePrivate)._inner.run(callback, applyThis, applyArgs);
	}

	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T {
		const zone = (this as any as AuroraZonePrivate)._inner;
		const task = zone.scheduleEventTask('AuroraZoneEvent: ' + name, callback, EMPTY_PAYLOAD, noop, noop);
		try {
			return zone.runTask(task, applyThis, applyArgs);
		} finally {
			zone.cancelTask(task);
		}
	}

	runScopeTask<T>(scope: ReactiveScopeControl<any>, callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T {
		const zone = (this as any as AuroraZonePrivate)._inner;
		const task = zone.scheduleTask(ScopeTask.eventTask(scope, 'AuroraZoneEvent: ' + name, callback, EMPTY_PAYLOAD, noop, noop))
		try {
			return zone.runTask(task, applyThis, applyArgs);
		} finally {
			zone.cancelTask(task);
		}
	}

	runStackTask<T>(stack: Stack, callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T {
		const zone = (this as any as AuroraZonePrivate)._inner;
		const task = zone.scheduleTask(StackTask.eventTask(stack, 'AuroraZoneEvent: ' + name, callback, EMPTY_PAYLOAD, noop, noop))
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


export class NoopAuroraZone implements AuroraZone {
	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T {
		return callback.apply(applyThis, applyArgs!);
	}
	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined, name?: string | undefined): T {
		return callback.apply(applyThis, applyArgs!);
	}
	runScopeTask<T>(scope: ReactiveScopeControl<ScopeContext>, callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T {
		try {
			scope.detach()
			return callback.apply(applyThis, applyArgs!);
		} finally {
			scope.reattach();
		}
	}

	runStackTask<T>(stack: Stack, callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T {
		try {
			stack.detach()
			return callback.apply(applyThis, applyArgs!);
		} finally {
			stack.reattach();
		}
	}
	runGuarded<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[] | undefined): T {
		return callback.apply(applyThis, applyArgs!);
	}
	runOutsideAurora<T>(callback: (...args: any[]) => T): T {
		return callback();
	}
}
