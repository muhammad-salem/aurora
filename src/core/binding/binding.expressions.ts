import {
	ExpressionNode, InfixExpressionNode, ScopeSubscription,
	Stack, findReactiveScopeByEventMap, ReactiveScope
} from '@ibyar/expressions';

type OneWayOperator = ':=';
type TwoWayOperator = ':=:';
type BindingOperators = OneWayOperator | TwoWayOperator;

export interface BindingAssignment extends InfixExpressionNode<BindingOperators> {
	initChangeSubscription(stack: Stack): void;

	destroy(): void;
}


export class OneWayAssignmentExpression extends InfixExpressionNode<OneWayOperator> implements BindingAssignment {
	private subscriptions?: ScopeSubscription<object>[];
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

	initChangeSubscription(stack: Stack): void {
		const events = this.right.events();
		const map = findReactiveScopeByEventMap(events, stack);
		const subscriptions: ScopeSubscription<object>[] = [];
		map.forEach((scope, eventName) => {
			const subscription = scope.subscribe((propertyName) => {
				if (propertyName == eventName) {
					this.get(stack);
				}
			});
			subscriptions.push(subscription);
		});
		this.subscriptions = subscriptions;
	}

	destroy() {
		this.subscriptions?.forEach(sub => sub.unsubscribe());
		this.subscriptions = undefined;
	}
}


/**
 * the default behaviour is assign the right hand side to the left hand side.
 * 
 * 
 */
export class TwoWayAssignmentExpression extends InfixExpressionNode<TwoWayOperator> implements BindingAssignment {
	private subscriptions?: ScopeSubscription<object>[];
	private updateLock = false;
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
				if (this.updateLock) {
					return
				}
				if (propertyName == eventName) {
					this.updateLock = true;
					this.getRTL(stack);
					this.updateLock = false;
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
				if (this.updateLock) {
					return
				}
				if (propertyName == eventName) {
					this.updateLock = true;
					this.getLTR(stack);
					this.updateLock = false;
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

	initChangeSubscription(stack: Stack): void {

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

		this.subscriptions = rtlSubscriptions.concat(ltrSubscriptions);
	}

	destroy() {
		this.subscriptions?.forEach(sub => sub.unsubscribe());
		this.subscriptions = undefined;
	}
}
