import { Stack } from '@ibyar/expressions';
import { AuroraZoneType } from './zone.js';

export class StackZone {

	constructor(private zone: AuroraZoneType, private stack: Stack) { }

	run<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
		try {
			this.before();
			return this.zone.run(callback, applyThis, applyArgs);
		} finally {
			this.after()
		}
	}

	runTask<T>(callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T {
		try {
			this.before();
			return this.zone.runTask(callback, applyThis, applyArgs, name);
		} finally {
			this.after()
		}
	}

	protected before() {
		this.stack.detach();
	}

	protected after() {
		this.stack.reattach();
	}
}
