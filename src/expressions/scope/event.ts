import { ExpressionEventMap } from '../api/expression.js';
import { ReactiveScope, Scope, ScopeContext } from './scope.js';
import { Stack } from './stack.js';

function visitInnerScope(eventNames: string[], events: ExpressionEventMap, scope: Scope<ScopeContext>, scopeTuples: [string, Scope<ScopeContext>][]) {
	eventNames.forEach(eventName => {
		if (eventName.startsWith(':')) {
			return;
		}
		scopeTuples.push([eventName, scope]);
		const nextEvents = Object.keys(events[eventName]);
		if (!nextEvents.length) {
			return;
		}
		const innerScope = scope.getScopeOrCreat(eventName);
		visitInnerScope(nextEvents, events[eventName], innerScope, scopeTuples);
	});
}

export function findScopeByEventMap(events: ExpressionEventMap, stack: Stack): [string, Scope<ScopeContext>][] {
	const scopeTuples: [string, Scope<ScopeContext>][] = [];
	const rootEventNames = Object.keys(events);
	rootEventNames.forEach(eventName => {
		const scope = stack.findScope<ScopeContext>(eventName);
		scopeTuples.push([eventName, scope]);
		const nextEvents = Object.keys(events[eventName]);
		if (!nextEvents.length) {
			return;
		}
		const eventScope = scope.getScopeOrCreat<ScopeContext>(eventName);
		visitInnerScope(nextEvents, events[eventName], eventScope, scopeTuples);
	});
	return scopeTuples;
}

export function findReactiveScopeByEventMap(events: ExpressionEventMap, stack: Stack): [string, ReactiveScope<ScopeContext>][] {
	const allScopes = findScopeByEventMap(events, stack);
	return allScopes.filter(tuple => tuple[1] instanceof ReactiveScope) as [string, ReactiveScope<ScopeContext>][];
}
