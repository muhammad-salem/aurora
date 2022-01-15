import {
	ExpressionNode, InfixExpressionNode, ScopeSubscription,
	Stack, findReactiveScopeByEventMap, ReactiveScope,
	ScopeContext, ValueChangedCallback, Scope,
	MemberExpression, Identifier
} from '@ibyar/expressions';
import { AsyncPipeProvider, AsyncPipeScope, PipeProvider } from '../pipe/pipe.js';

type OneWayOperator = '.=';
type TwoWayOperator = ':=';
type BindingOperators = OneWayOperator | TwoWayOperator;

export interface BindingAssignment extends InfixExpressionNode<BindingOperators> {
	subscribe(stack: Stack, pipelineNames?: string[]): ScopeSubscription<ScopeContext>[];
}


export class OneWayAssignmentExpression extends InfixExpressionNode<OneWayOperator> implements BindingAssignment {

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
		if (pipelineNames?.length) {
			const pipeScope = Scope.blockScope();
			const asyncPipeScope = AsyncPipeScope.blockScope();
			pipelineNames.forEach(pipelineName => {
				const scope = stack.findScope(pipelineName);
				const pipe = scope.get(pipelineName)!;
				if (scope instanceof AsyncPipeProvider) {
					asyncPipeScope.set(pipelineName, pipe);
				} else if (scope instanceof PipeProvider) {
					pipeScope.set(pipelineName, pipe);
				}
			});
			stack.pushScope(pipeScope);
			stack.pushScope(asyncPipeScope);
		}
		const tuples = findReactiveScopeByEventMap(this.rightEvents, stack);
		const subscriptions: ScopeSubscription<ScopeContext>[] = [];
		tuples.forEach(tuple => {
			const subscription = tuple[1].subscribe(tuple[0], (newValue: any, oldValue?: any) => {
				this.get(stack);
			});
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
export class TwoWayAssignmentExpression extends InfixExpressionNode<TwoWayOperator> implements BindingAssignment {

	protected left: MemberExpression;
	protected right: MemberExpression | Identifier;

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
		return (newValue: any, oldValue?: any) => {
			this.getRTL(stack);
		};
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
		return (newValue: any, oldValue?: any) => {
			this.getLTR(stack);
		};
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
