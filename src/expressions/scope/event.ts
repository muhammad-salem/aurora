import { ExpressionEventMap } from '../api/expression.js';
import { ReactiveScope, Scope, ScopeContext } from './scope.js';
import { Stack } from './stack.js';

function visitInnerEvents(events: ExpressionEventMap, scope: Scope<ScopeContext>, rootName: string, scopeMap: Map<string, Scope<object>>) {
	const innerEventNames = Object.keys(events);
	innerEventNames.forEach(eventName => {
		if (eventName.startsWith(':')) {
			return;
		}
		const innerScope = scope.getScope<ScopeContext>(eventName);
		if (innerScope) {
			const innerEventName = `${rootName}.${eventName}`;
			scopeMap.set(innerEventName, innerScope);
			visitInnerEvents(events[eventName], innerScope, innerEventName, scopeMap);
		}
	});
}

export function findScopeMap(events: ExpressionEventMap, stack: Stack): Map<string, Scope<object>> {
	const scopeMap = new Map<string, Scope<object>>();
	const rootEventNames = Object.keys(events);
	rootEventNames.forEach(eventName => {
		const scope = stack.findScope(eventName);
		scopeMap.set(eventName, scope);
		visitInnerEvents(events[eventName], scope, eventName, scopeMap);
	});
	return scopeMap;
}

export function buildReactiveScopeEvents(events: ExpressionEventMap, stack: Stack): Map<string, ReactiveScope<object>> {
	const scopeMap = new Map<string, ReactiveScope<object>>();
	const rootEventNames = Object.keys(events);
	rootEventNames.forEach(eventName => {
		const scope = stack.findScope(eventName);
		if (scope instanceof ReactiveScope) {
			scopeMap.set(eventName, scope as ReactiveScope<object>);
		}
		visitInnerEvents(events[eventName], scope, eventName, scopeMap);
	});
	return scopeMap;
}
