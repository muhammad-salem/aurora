import {
	Context, isReactive, isSignal,
	ReactiveScope, ReadOnlyScope, Scope,
	ScopeSubscription, ValueChangedCallback
} from '@ibyar/expressions';
import { HTMLComponent } from '../component/custom-element.js';
import { inject } from '../di/inject.js';
import { InjectionToken } from '../di/provider.js';
import { TemplateRef } from '../linker/template-ref.js';
import { ViewContainerRef } from '../linker/view-container-ref.js';
import { AuroraZone } from '../zone/zone.js';

export const NATIVE_HOST_TOKEN = new InjectionToken<HTMLElement>('NATIVE_HOST');
export const DIRECTIVE_HOST_TOKEN = new InjectionToken<HTMLComponent<any> | StructuralDirective>('DIRECTIVE_HOST');
export const SUCCESSORS_TOKEN = new InjectionToken<Record<string, TemplateRef>>('SUCCESSORS_TOKEN');

/**
 * A structural directive selector as '*if' '*for'
 */
export class StructuralDirective {
	protected zone = inject(AuroraZone);
	protected templateRef = inject(TemplateRef);
	protected host = inject(DIRECTIVE_HOST_TOKEN)!;
	private successors = inject(SUCCESSORS_TOKEN)!;
	protected viewContainerRef = inject(ViewContainerRef);

	getSuccessor(name: string): TemplateRef | undefined {
		return this.successors[name];
	}

}

/**
 * An attributes directive selector as '[class] [style]'
 */
export class AttributeDirective {
	protected el = inject(NATIVE_HOST_TOKEN)!;
	protected zone = inject(AuroraZone);
}


export class ReactiveSignalScope<T extends Context> extends ReactiveScope<T> {

	static for<T extends Context>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveSignalScope(context, propertyKeys);
	}

	static blockScope<T extends Context>(propertyKeys?: (keyof T)[]) {
		return new ReactiveSignalScope({} as T, propertyKeys);
	}

	static scopeForThis<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		const thisScope = ReactiveSignalScope.for(ctx, propertyKeys);
		const thisCtx = {
			'this': ctx,
		};
		const rootScope = Scope.for(thisCtx, ['this']);
		rootScope.setInnerScope('this', thisScope);
		return rootScope;
	}

	static readOnlyScopeForThis<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		const thisScope = ReactiveSignalScope.for(ctx, propertyKeys);
		const thisCtx = {
			'this': ctx,
		};
		const rootScope = ReadOnlyScope.for(thisCtx, ['this']);
		rootScope.setInnerScope('this', thisScope);
		return rootScope;
	}

	override get(propertyKey: keyof T) {
		const value = super.get(propertyKey);
		if (isReactive(value)) {
			return value.get();
		}
		return value;
	}

	override set(propertyKey: keyof T, newValue: any, receiver?: any): boolean {
		const value = Reflect.get(this._ctx, propertyKey) as any;
		if (isSignal(value)) {
			value.set(newValue);
			return true;
		} else {
			return super.set(propertyKey, newValue, receiver);
		}
	}

	override subscribe(propertyKey: keyof T, callback: ValueChangedCallback): ScopeSubscription<T> {
		const value = Reflect.get(this._ctx, propertyKey) as any;
		if (isSignal(value)) {
			return value.subscribe(callback);
		} else {
			return super.subscribe(propertyKey, callback);
		}
	}

	override unsubscribe(propertyKey?: keyof T | undefined, subscription?: ScopeSubscription<T> | undefined): void {
		if (propertyKey) {
			const value = Reflect.get(this._ctx, propertyKey) as any;
			if (isSignal(value)) {
				value.getScope().unsubscribe(value.getIndex(), subscription);
				return;
			}
		}
		super.unsubscribe(propertyKey, subscription);
	}

}
