import {
	ExpressionNode, InfixExpressionNode, ScopeSubscription,
	Stack, findScopeByEventMap, ReactiveScope,
	ScopeContext, ValueChangedCallback, Scope,
	MemberExpression, Identifier
} from '@ibyar/expressions';
import { AsyncPipeProvider, AsyncPipeScope } from '../pipe/pipe.js';

type OneWayOperator = ':=';
type TwoWayOperator = ':=:';
type BindingOperators = OneWayOperator | TwoWayOperator;

export interface BindingAssignment extends InfixExpressionNode<BindingOperators> {
	subscribe(stack: Stack, pipelineNames?: string[]): ScopeSubscription<ScopeContext>[];
}


export class OneWayAssignmentExpression extends InfixExpressionNode<OneWayOperator> implements BindingAssignment {

	private rightEvents = this.right.events();
	constructor(left: MemberExpression, right: ExpressionNode) {
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
	subscribe(stack: Stack, pipelineNames?: string[]): ScopeSubscription<ScopeContext>[] {
		if (pipelineNames?.length) {
			const asyncPipeScope = new AsyncPipeScope();
			pipelineNames.forEach(pipeline => {
				const scope = stack.findScope(pipeline);
				if (scope instanceof AsyncPipeProvider) {
					const pipe = scope.get(pipeline)!;
					asyncPipeScope.set(pipeline, pipe);
				}
			});
			stack.pushScope(asyncPipeScope);
		}
		const map = findScopeByEventMap(this.rightEvents, stack);
		const subscriptions: ScopeSubscription<ScopeContext>[] = [];
		map.forEach((scope, eventName) => {
			if (scope instanceof ReactiveScope) {
				const subscription = scope.subscribe(eventName, (newValue: any, oldValue?: any) => {
					if (newValue != oldValue) {
						this.get(stack);
					}
				});
				subscriptions.push(subscription);
			}
		});
		return subscriptions;
	}
}


/**
 * the default behavior is assign the right hand side to the left hand side.
 * 
 * 
 */
export class TwoWayAssignmentExpression extends InfixExpressionNode<TwoWayOperator> implements BindingAssignment {

	protected left: MemberExpression;
	protected right: MemberExpression | Identifier;

	private rightEvents = this.right.events();
	private leftEvents = this.left.events();
	constructor(left: MemberExpression, right: MemberExpression | Identifier) {
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
		return (newValue: any, oldValue?: any) => {
			if (newValue != oldValue) {
				this.getRTL(stack);
			}
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
		return (newValue: any, oldValue?: any) => {
			if (newValue != oldValue) {
				this.getLTR(stack);
			}
		};
	}

	private subscribeToEvents(stack: Stack, map: Map<string, Scope<ScopeContext>>, actionCallback: ValueChangedCallback) {
		const subscriptions: ScopeSubscription<ScopeContext>[] = [];
		map.forEach((scope, eventName) => {
			if (scope instanceof ReactiveScope) {
				const subscription = scope.subscribe(eventName, actionCallback);
				subscriptions.push(subscription);
			}
		});
		return subscriptions;
	}

	subscribe(stack: Stack): ScopeSubscription<ScopeContext>[] {

		// right to left
		const rightMap = findScopeByEventMap(this.rightEvents, stack);
		const rtlAction = this.actionRTL(stack);
		const rtlSubscriptions = this.subscribeToEvents(stack, rightMap, rtlAction);

		// left to right 
		const leftMap = findScopeByEventMap(this.leftEvents, stack);
		const ltrAction = this.actionLTR(stack);
		const ltrSubscriptions = this.subscribeToEvents(stack, leftMap, ltrAction);

		return rtlSubscriptions.concat(ltrSubscriptions);
	}

}
