import { ExpressionEventMap } from '../api/expression.js';
import { ReactiveScope, Scope, ScopeContext } from './scope.js';
import { Stack } from './stack.js';

function visitInnerScope(eventNames: string[], events: ExpressionEventMap, scope: Scope<ScopeContext>, scopeMap: Map<string, Scope<object>>) {
	eventNames.forEach(eventName => {
		if (eventName.startsWith(':')) {
			return;
		}
		scopeMap.set(eventName, scope);
		const nextEvents = Object.keys(events[eventName]);
		if (!nextEvents.length) {
			return;
		}
		const innerScope = scope.getScopeOrCreat(eventName);
		visitInnerScope(nextEvents, events[eventName], innerScope, scopeMap);
	});
}

export function findScopeByEventMap(events: ExpressionEventMap, stack: Stack): Map<string, Scope<ScopeContext>> {
	const scopeMap = new Map<string, Scope<object>>();
	const rootEventNames = Object.keys(events);
	rootEventNames.forEach(eventName => {
		const scope = stack.findScope<ScopeContext>(eventName);
		scopeMap.set(eventName, scope);
		const nextEvents = Object.keys(events[eventName]);
		if (!nextEvents.length) {
			return;
		}
		const eventScope = scope.getScopeOrCreat<ScopeContext>(eventName);
		visitInnerScope(nextEvents, events[eventName], eventScope, scopeMap);
	});
	return scopeMap;
}

export function findReactiveScopeByEventMap(events: ExpressionEventMap, stack: Stack): Map<string, ReactiveScope<ScopeContext>> {
	const allScopes = findScopeByEventMap(events, stack);

	const scopeMap = new Map<string, ReactiveScope<ScopeContext>>();
	allScopes.forEach((scope, eventName) => {
		if (scope instanceof ReactiveScope) {
			scopeMap.set(eventName, scope);
		}
	});
	return scopeMap;
}
