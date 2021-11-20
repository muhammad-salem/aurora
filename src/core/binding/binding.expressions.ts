import {
	ExpressionNode, InfixExpressionNode, ScopeSubscription,
	Stack, findReactiveScopeByEventMap, ReactiveScope, ScopeContext
} from '@ibyar/expressions';

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
		const map = findReactiveScopeByEventMap(events, stack);
		const subscriptions: ScopeSubscription<ScopeContext>[] = [];
		map.forEach((scope, eventName) => {
			const subscription = scope.subscribe((propertyName) => {
				if (propertyName == eventName) {
					this.get(stack);
				}
			});
			subscriptions.push(subscription);
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
	private actionRTL(stack: Stack) {
		return (eventName: string) => {
			return (propertyName: never, oldValue: any, newValue: any) => {
				if (propertyName == eventName) {
					this.getRTL(stack);
				}
			}
		}
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
	private actionLTR(stack: Stack) {
		return (eventName: string) => {
			return (propertyName: never, oldValue: any, newValue: any) => {
				if (propertyName == eventName) {
					this.getLTR(stack);
				}
			}
		}
	}

	private subscribeToEvents(
		map: Map<string, ReactiveScope<object>>,
		action: (eventName: string) => (propertyName: never, oldValue: any, newValue: any) => void) {
		const subscriptions: ScopeSubscription<object>[] = [];
		map.forEach((scope, eventName) => {
			const subscription = scope.subscribe(action(eventName));
			subscriptions.push(subscription);
		});
		return subscriptions;
	}

	subscribe(stack: Stack): ScopeSubscription<ScopeContext>[] {

		// right to left
		const rightEvents = this.right.events();
		const rightMap = findReactiveScopeByEventMap(rightEvents, stack);
		const rtlAction = this.actionRTL(stack);
		const rtlSubscriptions = this.subscribeToEvents(rightMap, rtlAction);

		// left to right 
		const leftEvents = this.left.events();
		const leftMap = findReactiveScopeByEventMap(leftEvents, stack);
		const ltrAction = this.actionLTR(stack);
		const ltrSubscriptions = this.subscribeToEvents(leftMap, ltrAction);

		return rtlSubscriptions.concat(ltrSubscriptions);
	}

}
