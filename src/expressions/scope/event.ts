import { ExpressionEventMap } from '../api/expression.js';
import { ReactiveScope, Scope, ScopeContext } from './scope.js';
import { Stack } from './stack.js';

function visitInnerScope(events: ExpressionEventMap, scope: Scope<ScopeContext>, scopeMap: Map<string, Scope<object>>) {
	const eventNames = Object.keys(events);
	if (!eventNames.length) {
		return;
	}
	eventNames.forEach(eventName => {
		if (eventName.startsWith(':')) {
			return;
		}
		scopeMap.set(eventName, scope);
		const innerScope = scope.getScope<ScopeContext>(eventName);
		innerScope && visitInnerScope(events[eventName], innerScope, scopeMap);
	});
}

export function findScopeByEventMap(events: ExpressionEventMap, stack: Stack): Map<string, Scope<object>> {
	const scopeMap = new Map<string, Scope<object>>();
	const rootEventNames = Object.keys(events);
	rootEventNames.forEach(eventName => {
		const scope = stack.findScope<ScopeContext>(eventName);
		scopeMap.set(eventName, scope);
		const eventScope = scope.getScope<ScopeContext>(eventName);
		if (eventScope) {
			visitInnerScope(events[eventName], eventScope, scopeMap);
		}
	});
	return scopeMap;
}

export function findReactiveScopeByEventMap(events: ExpressionEventMap, stack: Stack): Map<string, ReactiveScope<object>> {
	const allScopes = findScopeByEventMap(events, stack);

	const scopeMap = new Map<string, ReactiveScope<object>>();
	allScopes.forEach((scope, eventName) => {
		if (scope instanceof ReactiveScope) {
			scopeMap.set(eventName, scope as ReactiveScope<object>);
		}
	});
	return scopeMap;
}
