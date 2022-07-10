import {
	ExpressionNode, InfixExpressionNode, ScopeSubscription,
	Stack, findReactiveScopeByEventMap, ReactiveScope,
	ScopeContext, ValueChangedCallback, Scope,
	MemberExpression, Identifier, Deserializer
} from '@ibyar/expressions';
import { createSubscriptionDestroyer } from '../context/subscription.js';
import { isOnDestroy } from '../component/lifecycle.js';
import { AsyncPipeProvider, AsyncPipeScope, PipeProvider } from '../pipe/pipe.js';

type OneWayOperator = '.=';
type TwoWayOperator = ':=';
type BindingOperators = OneWayOperator | TwoWayOperator;

export interface BindingAssignment extends InfixExpressionNode<BindingOperators> {
	subscribe(stack: Stack, pipelineNames?: string[]): ScopeSubscription<ScopeContext>[];
}


@Deserializer('OneWayAssignment')
export class OneWayAssignmentExpression extends InfixExpressionNode<OneWayOperator> implements BindingAssignment {

	declare protected left: MemberExpression;
	private rightEvents = this.right.events();
	constructor(left: MemberExpression, right: ExpressionNode) {
		super('.=', left, right);
	}
	set(stack: Stack, value: any) {
		return this.left.set(stack, value);
	}
	get(stack: Stack): any {
		const rv = this.right.get(stack);
		this.set(stack, rv);
		return rv;
	}
	subscribe(stack: Stack, pipelineNames?: string[]): ScopeSubscription<ScopeContext>[] {
		const subscriptions: ScopeSubscription<ScopeContext>[] = [];
		if (pipelineNames?.length) {
			const syncPipeScope = Scope.blockScope();
			const asyncPipeScope = AsyncPipeScope.blockScope();
			let hasAsync = false, hasSync = false;
			pipelineNames.forEach(pipelineName => {
				const scope = stack.findScope(pipelineName);
				const pipe = scope.get(pipelineName)!;
				if (scope instanceof AsyncPipeProvider) {
					hasAsync = true;
					asyncPipeScope.set(pipelineName, pipe);
					if (isOnDestroy(pipe.prototype)) {
						subscriptions.push(createSubscriptionDestroyer(() => asyncPipeScope.unsubscribe(pipelineName)));
					}
				} else if (scope instanceof PipeProvider) {
					hasSync = true;
					syncPipeScope.set(pipelineName, pipe);
				}
			});
			hasSync && stack.pushScope(syncPipeScope);
			hasAsync && stack.pushScope(asyncPipeScope);
		}
		const tuples = findReactiveScopeByEventMap(this.rightEvents, stack);
		const callback: ValueChangedCallback = () => this.get(stack);
		tuples.forEach(tuple => {
			const subscription = tuple[1].subscribe(tuple[0], callback);
			subscriptions.push(subscription);
		});
		return subscriptions;
	}
}


/**
 * the default behavior is assign the right hand side to the left hand side.
 * 
 * 
 */
@Deserializer('TwoWayAssignment')
export class TwoWayAssignmentExpression extends InfixExpressionNode<TwoWayOperator> implements BindingAssignment {

	declare protected left: MemberExpression;
	declare protected right: MemberExpression | Identifier;

	private rightEvents = this.right.events();
	private leftEvents = this.left.events();
	constructor(left: MemberExpression, right: MemberExpression | Identifier) {
		super(':=', left, right);
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
		const rv = this.right.get(stack);
		this.setRTL(stack, rv);
		return rv;
	}
	private actionRTL(stack: Stack): ValueChangedCallback {
		return () => this.getRTL(stack);
	}

	private setLTR(stack: Stack, value: any) {
		return this.right.set(stack, value);
	}
	private getLTR(stack: Stack): any {
		const lv = this.left.get(stack);
		this.setLTR(stack, lv);
		return lv;
	}
	private actionLTR(stack: Stack): ValueChangedCallback {
		return () => this.getLTR(stack);
	}

	private subscribeToEvents(stack: Stack, tuples: [string, ReactiveScope<ScopeContext>][], actionCallback: ValueChangedCallback) {
		const subscriptions: ScopeSubscription<ScopeContext>[] = [];
		tuples.forEach(tuple => {
			const subscription = tuple[1].subscribe(tuple[0], actionCallback);
			subscriptions.push(subscription);
		});
		return subscriptions;
	}

	subscribe(stack: Stack): ScopeSubscription<ScopeContext>[] {

		// right to left
		const rightTuples = findReactiveScopeByEventMap(this.rightEvents, stack);
		const rtlAction = this.actionRTL(stack);
		const rtlSubscriptions = this.subscribeToEvents(stack, rightTuples, rtlAction);

		// left to right 
		const leftTuples = findReactiveScopeByEventMap(this.leftEvents, stack);
		const ltrAction = this.actionLTR(stack);
		const ltrSubscriptions = this.subscribeToEvents(stack, leftTuples, ltrAction);

		return rtlSubscriptions.concat(ltrSubscriptions);
	}

}
