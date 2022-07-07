import { ReactiveScopeControl, ScopeContext } from '@ibyar/expressions';
import { AuroraZoneType } from './zone.js';

export class ScopeZone<X extends ScopeContext> {

	constructor(private zone: AuroraZoneType, private scope: ReactiveScopeControl<X>) { }

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
		this.scope.detach();
	}

	protected after() {
		this.scope.reattach();
	}
}
