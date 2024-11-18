import {
	Context, DeclarationExpression, Deserializer,
	ExpressionEventMap, ExpressionNode,
	Identifier, InfixExpressionNode, MemberExpression,
	NodeDeserializer, ReactiveScope, Scope, ScopeSubscription,
	Signal, Stack, ValueChangedCallback, VisitNodeType,
	findReactiveScopeByEventMap
} from '@ibyar/expressions';
import { isOnDestroy } from '../component/lifecycle.js';
import { createDestroySubscription } from '../context/subscription.js';
import { AsyncPipeProvider, AsyncPipeScope, PipeProvider } from '../pipe/pipe.js';

type OneWayOperator = '=:';
type TwoWayOperator = '=::';
type BindingOperators = OneWayOperator | TwoWayOperator;

export interface BindingAssignment extends InfixExpressionNode<BindingOperators> {
	subscribe(stack: Stack, pipelineNames?: string[]): ScopeSubscription<Context>[];
}


@Deserializer('OneWayAssignment')
export class OneWayAssignmentExpression extends InfixExpressionNode<OneWayOperator> implements BindingAssignment {
	static fromJSON(node: OneWayAssignmentExpression, deserializer: NodeDeserializer): OneWayAssignmentExpression {
		return new OneWayAssignmentExpression(
			deserializer(node.left) as MemberExpression | DeclarationExpression,
			deserializer(node.right)
		);
	}
	static visit(node: OneWayAssignmentExpression, visitNode: VisitNodeType): void {
		visitNode(node.left);
		visitNode(node.right);
	}

	declare protected left: MemberExpression;
	private rightEvents = this.right.events();
	constructor(left: MemberExpression | DeclarationExpression, right: ExpressionNode) {
		super('=:', left, right);
	}
	set(stack: Stack, value: any) {
		const left = this.left.get(stack);
		if (left instanceof Signal) {
			left.set(value);
			return value;
		}
		return this.left.set(stack, value);
	}
	get(stack: Stack): any {
		const rv = this.right.get(stack);
		this.set(stack, rv);
		return rv;
	}
	subscribe(stack: Stack, pipelineNames?: string[]): ScopeSubscription<Context>[] {
		const subscriptions: ScopeSubscription<Context>[] = [];
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
						subscriptions.push(createDestroySubscription(() => asyncPipeScope.unsubscribe(pipelineName)));
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
	static fromJSON(node: TwoWayAssignmentExpression, deserializer: NodeDeserializer): TwoWayAssignmentExpression {
		return new TwoWayAssignmentExpression(
			deserializer(node.left) as MemberExpression,
			deserializer(node.right) as MemberExpression | Identifier
		);
	}
	static visit(node: TwoWayAssignmentExpression, visitNode: VisitNodeType): void {
		visitNode(node.left);
		visitNode(node.right);
	}

	declare protected left: MemberExpression;
	declare protected right: MemberExpression | Identifier;

	private rightEvents: ExpressionEventMap;
	private leftEvents: ExpressionEventMap;
	constructor(left: MemberExpression, right: MemberExpression | Identifier) {
		super('=::', left, right);
		this.rightEvents = this.right.events();
		this.leftEvents = this.left.events();
	}

	set(stack: Stack, value: any) {
		return this.setRTL(stack, value);
	}
	get(stack: Stack): any {
		return this.getRTL(stack);
	}

	private setRTL(stack: Stack, value: any) {
		const left = this.left.get(stack);
		if (left instanceof Signal) {
			left.set(value);
			return value;
		}
		return this.left.set(stack, value);
	}
	private getRTL(stack: Stack): any {
		let rv = this.right.get(stack);
		if (rv instanceof Signal) {
			rv = rv.get();
		}
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

	private subscribeToEvents(stack: Stack, tuples: [string, ReactiveScope<Context>][], actionCallback: ValueChangedCallback) {
		const subscriptions: ScopeSubscription<Context>[] = [];
		tuples.forEach(tuple => {
			const subscription = tuple[1].subscribe(tuple[0], actionCallback);
			subscriptions.push(subscription);
		});
		return subscriptions;
	}

	subscribe(stack: Stack): ScopeSubscription<Context>[] {

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
