import { ReactiveScopeControl, ScopeContext, Stack } from '@ibyar/expressions';

const notScheduled: 'notScheduled' = 'notScheduled',
	scheduling: 'scheduling' = 'scheduling',
	scheduled: 'scheduled' = 'scheduled',
	running: 'running' = 'running',
	canceling: 'canceling' = 'canceling',
	unknown: 'unknown' = 'unknown';
const microTask: 'microTask' = 'microTask',
	macroTask: 'macroTask' = 'macroTask',
	eventTask: 'eventTask' = 'eventTask';

export abstract class AbstractTask<T extends TaskType> implements Task {

	public runCount: number = 0;
	_zone: Zone | null = null;
	_state: TaskState = 'notScheduled';

	constructor(
		public type: T,
		public source: string,
		public callback: Function,
		public data?: TaskData,
		public scheduleFn?: (task: Task) => void,
		public cancelFn?: (task: Task) => void) {
		if (!callback) {
			throw new Error('callback is not defined');
		}
	}

	get zone(): Zone {
		return this._zone!;
	}

	get state(): TaskState {
		return this._state;
	}

	public cancelScheduleRequest() {
		this._transitionTo(notScheduled, scheduling);
	}

	_transitionTo(toState: TaskState, fromState1: TaskState, fromState2?: TaskState) {
		if (this._state === fromState1 || this._state === fromState2) {
			this._state = toState;
		} else {
			throw new Error(`${this.type} '${this.source}': can not transition to '${toState}', expecting state '${fromState1}'${fromState2 ? ' or \'' + fromState2 + '\'' : ''}, was '${this._state}'.`);
		}
	}

	public toString() {
		if (this.data && typeof this.data.handleId !== 'undefined') {
			return this.data.handleId.toString();
		} else {
			return Object.prototype.toString.call(this);
		}
	}
	public toJSON() {
		return {
			type: this.type,
			state: this.state,
			source: this.source,
			zone: this.zone.name,
			runCount: this.runCount
		};
	}

	abstract invoke(task: any, target: any, args: any): any;
}

export class ScopeTask<T extends TaskType> extends AbstractTask<T> {
	static microTask(scope: ReactiveScopeControl<any>, source: string, callback: Function, data?: TaskData, customSchedule?: (task: Task) => void) {
		return new ScopeTask(scope, microTask, source, callback, data, customSchedule, undefined);
	}
	static macroTask(scope: ReactiveScopeControl<any>, source: string, callback: Function, data?: TaskData, customSchedule?: (task: Task) => void, customCancel?: (task: Task) => void) {
		return new ScopeTask(scope, macroTask, source, callback, data, customSchedule, customCancel);
	}
	static eventTask(scope: ReactiveScopeControl<any>, source: string, callback: Function, data?: TaskData, customSchedule?: (task: Task) => void, customCancel?: (task: Task) => void) {
		return new ScopeTask(scope, eventTask, source, callback, data, customSchedule, customCancel);
	}

	constructor(
		public scope: ReactiveScopeControl<any>,
		type: T,
		source: string,
		callback: Function,
		data?: TaskData,
		scheduleFn?: (task: Task) => void,
		cancelFn?: (task: Task) => void) {
		super(type, source, callback, data, scheduleFn, cancelFn);
	}
	invoke(task: any, target: any, args: any) {
		try {
			this.runCount++;
			this.scope.detach();
			return this.zone.runTask(task, target, args);
		} finally {
			this.scope.reattach();
		}
	}
	public toJSON() {
		return Object.assign(super.toJSON(), { scope: this.scope });
	}
}

export class StackTask<T extends TaskType> extends AbstractTask<T> {

	static microTask(stack: Stack, source: string, callback: Function, data?: TaskData, customSchedule?: (task: Task) => void) {
		return new StackTask(stack, microTask, source, callback, data, customSchedule, undefined);
	}
	static macroTask(stack: Stack, source: string, callback: Function, data?: TaskData, customSchedule?: (task: Task) => void, customCancel?: (task: Task) => void) {
		return new StackTask(stack, macroTask, source, callback, data, customSchedule, customCancel);
	}
	static eventTask(stack: Stack, source: string, callback: Function, data?: TaskData, customSchedule?: (task: Task) => void, customCancel?: (task: Task) => void) {
		return new StackTask(stack, eventTask, source, callback, data, customSchedule, customCancel);
	}

	constructor(
		public stack: Stack,
		type: T,
		source: string,
		callback: Function,
		data: TaskData | undefined,
		scheduleFn: ((task: Task) => void) | undefined,
		cancelFn: ((task: Task) => void) | undefined) {
		super(type, source, callback, data, scheduleFn, cancelFn);
	}
	invoke(task: any, target: any, args: any) {
		try {
			this.runCount++;
			this.stack.detach();
			return this.zone.runTask(task, target, args);
		} finally {
			this.stack.reattach();
		}
	}
	public toJSON() {
		return Object.assign(super.toJSON(), { stack: this.stack });
	}
}
