import { ExpressionEventMap } from '../api/expression.js';
import { ReactiveScope, Scope, Context } from './scope.js';
import { Stack } from './stack.js';

function visitInnerScope(eventNames: string[], events: ExpressionEventMap, scope: Scope<Context>, scopeTuples: [string, Scope<Context>][]) {
	eventNames.forEach(eventName => {
		if (eventName.startsWith(':')) {
			return;
		}
		scopeTuples.push([eventName, scope]);
		const nextEvents = Object.keys(events[eventName]);
		if (!nextEvents.length) {
			return;
		}
		const innerScope = scope.getInnerScope(eventName) ?? scope.setInnerScope(eventName);
		visitInnerScope(nextEvents, events[eventName], innerScope, scopeTuples);
	});
}

export function findScopeByEventMap(events: ExpressionEventMap, stack: Stack): [string, Scope<Context>][] {
	const scopeTuples: [string, Scope<Context>][] = [];
	const rootEventNames = Object.keys(events);
	rootEventNames.forEach(eventName => {
		const scope = stack.findScope<Context>(eventName);
		scopeTuples.push([eventName, scope]);
		const nextEvents = Object.keys(events[eventName]);
		if (!nextEvents.length) {
			return;
		}
		const eventScope = scope.getInnerScope(eventName) ?? scope.setInnerScope(eventName);
		visitInnerScope(nextEvents, events[eventName], eventScope, scopeTuples);
	});
	return scopeTuples;
}

export function findReactiveScopeByEventMap(events: ExpressionEventMap, stack: Stack): [string, ReactiveScope<Context>][] {
	const allScopes = findScopeByEventMap(events, stack);
	return allScopes.filter(tuple => tuple[1] instanceof ReactiveScope) as [string, ReactiveScope<Context>][];
}
