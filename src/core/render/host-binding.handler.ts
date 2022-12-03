import type { AssignmentExpression, Stack } from '@ibyar/expressions';
import type { HostBindingRef } from '../component/reflect.js';
import type { RenderHandler } from './render-handler.js';
import type { AuroraZone } from '../zone/zone.js';
import type { Subscription } from '../component/events.js';
import { JavaScriptParser } from '@ibyar/expressions';

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
	private assignment: AssignmentExpression;
	private subscription?: Subscription<any>;


	constructor(private hostBindingRef: HostBindingRef, private contextStack: Stack, private zone: AuroraZone) { }

	onInit(): void {
		const binding = `this.${this.hostBindingRef.hostPropertyName} = ${this.hostBindingRef.modelPropertyName}`;
		this.assignment = JavaScriptParser.parseScript<AssignmentExpression>(binding);
		this.subscription = this.zone.onFinal.subscribe(() => this.assignment.get(this.contextStack));
	}

	onConnect() {
		if (this.subscription) {
			return;
		}
		this.onInit();
	}

	onDisconnect() {
		if (!this.subscription) {
			return;
		}
		this.onDestroy();
	}

	onDestroy(): void {
		this.subscription?.unsubscribe();
		delete this.subscription;
	}

}
