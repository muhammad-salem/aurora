import type { ExpressionEventMap, Scope, Stack } from '@ibyar/expressions';

function visitInnerEvents(events: ExpressionEventMap, scope: Scope<object>, rootName: string, scopeMap: Map<string, Scope<object>>) {
	const innerEventNames = Object.keys(events);
	innerEventNames.forEach(eventName => {
		if (eventName.startsWith(':')) {
			return;
		}
		const innerScope = scope.getScope(eventName);
		if (innerScope) {
			const innerEventName = `${rootName}.${eventName}`;
			scopeMap.set(innerEventName, innerScope);
			visitInnerEvents(events[eventName], innerScope, innerEventName, scopeMap);
		}
	});
}

export function findScopeMap(events: ExpressionEventMap, stack: Stack) {
	const scopeMap = new Map<string, Scope<object>>();
	const rootEventNames = Object.keys(events);
	rootEventNames.forEach(eventName => {
		const scope = stack.findScope(eventName);
		scopeMap.set(eventName, scope);
		visitInnerEvents(events[eventName], scope, eventName, scopeMap);
	});
	return scopeMap;
}
