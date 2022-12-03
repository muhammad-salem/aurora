import type { AssignmentExpression, Context, MemberExpression, ScopeSubscription, Stack } from '@ibyar/expressions';
import type { HostBindingRef } from '../component/reflect.js';
import type { RenderHandler } from './render-handler.js';
import { JavaScriptParser } from '@ibyar/expressions';
import { OneWayAssignmentExpression } from '../binding/binding.expressions.js';
import { AuroraZone } from '../zone/zone.js';

/**
 * ```ts
 * @Component({selector: 'tag-name'})
 * class ComponentModelOrAttributeDirectiveModel {
 * 
 *   name = 'abcd';
 * 
 *   @HostBinding(‘class.span’)
 *   span: boolean = true;
 * 
 *   @HostListener('click')
 *   onClick() {
 *      this.span = !this.span;
 *   }
 * 
 *   @HostBinding('class.valid')
 *   get valid(){
 *     return this.name?.startsWith('abc');
 *   }
 * 
 * }
 * 
 * // js: one way binding
 * this.class.span =: span;
 * this.class.valid =: valid;
 * 
 * 
 * ```
 * 
 */
export class HostBindingHandler implements RenderHandler {
	private subscriptions: ScopeSubscription<Context>[];

	constructor(private hostBindingRef: HostBindingRef, private contextStack: Stack/*, private zone: AuroraZone*/) { }

	onInit(): void {
		const binding = `this.${this.hostBindingRef.hostPropertyName} = ${this.hostBindingRef.modelPropertyName}`;
		console.log('binding', binding);
		const assignment = JavaScriptParser.parseScript<AssignmentExpression>(binding);
		const expression = new OneWayAssignmentExpression(assignment.getLeft() as MemberExpression, assignment.getRight());
		this.subscriptions = expression.subscribe(this.contextStack);
		expression.get(this.contextStack);
		// const s = this.zone.onFinal.subscribe(() => assignment.get(this.contextStack));
	}

	onConnect() {
		this.subscriptions.forEach(subscription => subscription.resume());
	}

	onDisconnect() {
		this.subscriptions.forEach(subscription => subscription.pause());
	}

	onDestroy(): void {
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
	}

}
