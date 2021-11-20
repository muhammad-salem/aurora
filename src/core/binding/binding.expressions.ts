import {
	ExpressionNode, InfixExpressionNode, ScopeSubscription,
	Stack, findScopeByEventMap, ReactiveScope,
	ScopeContext, ValueChangedCallback, Scope
} from '@ibyar/expressions';
import { AsyncPipeProvider } from '../pipe/pipe.js';

type OneWayOperator = ':=';
type TwoWayOperator = ':=:';
type BindingOperators = OneWayOperator | TwoWayOperator;

export interface BindingAssignment extends InfixExpressionNode<BindingOperators> {
	subscribe(stack: Stack): ScopeSubscription<ScopeContext>[];
}


export class OneWayAssignmentExpression extends InfixExpressionNode<OneWayOperator> implements BindingAssignment {

	constructor(left: ExpressionNode, right: ExpressionNode) {
		super(':=', left, right);
	}
	set(stack: Stack, value: any) {
		return this.left.set(stack, value);
	}
	get(stack: Stack): any {
		const lv = this.left.get(stack);
		const rv = this.right.get(stack);
		if (lv !== rv) {
			this.set(stack, rv);
		}
		return rv;
	}
	subscribe(stack: Stack): ScopeSubscription<ScopeContext>[] {
		const events = this.right.events();
		const map = findScopeByEventMap(events, stack);
		const subscriptions: ScopeSubscription<ScopeContext>[] = [];
		map.forEach((scope, eventName) => {
			if (scope instanceof ReactiveScope) {
				const subscription = scope.subscribe(eventName, () => {
					this.get(stack);
				});
				subscriptions.push(subscription);
			} else if (scope instanceof AsyncPipeProvider) {
				const pipe = scope.get(eventName)!;
				const pipeScope = stack.pushBlockReactiveScopeFor({
					[eventName](value: any, ...args: any[]) {
						pipe.transform(value, ...args)
					}
				});
			}
		});
		return subscriptions;
	}
}


/**
 * the default behaviour is assign the right hand side to the left hand side.
 * 
 * 
 */
export class TwoWayAssignmentExpression extends InfixExpressionNode<TwoWayOperator> implements BindingAssignment {
	constructor(left: ExpressionNode, right: ExpressionNode) {
		super(':=:', left, right);
	}

	set(stack: Stack, value: any) {
		return this.setRTL(stack, value);
	}
	get(stack: Stack): any {
		return this.getRTL(stack);
	}

	private setRTL(stack: Stack, value: any) {
		return this.left.set(stack, value);
	}
	private getRTL(stack: Stack): any {
		const lv = this.left.get(stack);
		const rv = this.right.get(stack);
		if (lv !== rv) {
			this.setRTL(stack, rv);
		}
		return rv;
	}
	private actionRTL(stack: Stack): ValueChangedCallback {
		return () => {
			this.getRTL(stack);
		};
	}

	private setLTR(stack: Stack, value: any) {
		return this.right.set(stack, value);
	}
	private getLTR(stack: Stack): any {
		const lv = this.left.get(stack);
		const rv = this.right.get(stack);
		if (lv !== rv) {
			this.setLTR(stack, lv);
		}
		return lv;
	}
	private actionLTR(stack: Stack): ValueChangedCallback {
		return () => {
			this.getLTR(stack);
		};
	}

	private subscribeToEvents(stack: Stack, map: Map<string, Scope<ScopeContext>>, actionCallback: ValueChangedCallback) {
		const subscriptions: ScopeSubscription<ScopeContext>[] = [];
		map.forEach((scope, eventName) => {
			if (scope instanceof ReactiveScope) {
				const subscription = scope.subscribe(eventName, actionCallback);
				subscriptions.push(subscription);
			} else if (scope instanceof AsyncPipeProvider) {
				const pipe = scope.get(eventName)!;
				const pipeScope = stack.pushBlockReactiveScopeFor({
					[eventName](value: any, ...args: any[]) {
						pipe.transform(value, ...args)
					}
				});
			}
		});
		return subscriptions;
	}

	subscribe(stack: Stack): ScopeSubscription<ScopeContext>[] {

		// right to left
		const rightEvents = this.right.events();
		const rightMap = findScopeByEventMap(rightEvents, stack);
		const rtlAction = this.actionRTL(stack);
		const rtlSubscriptions = this.subscribeToEvents(stack, rightMap, rtlAction);

		// left to right 
		const leftEvents = this.left.events();
		const leftMap = findScopeByEventMap(leftEvents, stack);
		const ltrAction = this.actionLTR(stack);
		const ltrSubscriptions = this.subscribeToEvents(stack, leftMap, ltrAction);

		return rtlSubscriptions.concat(ltrSubscriptions);
	}

}
