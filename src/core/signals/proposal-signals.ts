import { ReactiveScope } from '@ibyar/expressions';
import { Signal } from 'signal-polyfill';


export function setupScopesForSignal(signal: Signal.State<any> | Signal.Computed<any>, parent: ReactiveScope<any>, name: string) {
	const symbols = Object.getOwnPropertySymbols(signal);
	const scope = new ReactiveScope(signal, symbols as any, name, parent);
	parent.setInnerScope(name, scope);

	const symbol = symbols[0];
	const contextScope = new ReactiveScope(signal as any[symbol], ['value', 'version'], symbol, scope);
	scope.setInnerScope(symbol as any, contextScope);

	return scope;
}
