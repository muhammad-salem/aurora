
import { getBootstrapMatadata } from '@aurorats/metadata';
import { ComponentRef, DirectiveRef, PropertyRef } from '../component/component.js';

export type ProviderType = 'component' | 'service' | 'directive' | 'pipe' | 'self';

export class ClassRegistry {
	viewSet: Set<Function> = new Set();
	componentSet: Set<Function> = new Set();
	serviceSet: Set<Function> = new Set();
	directiveSet: Set<Function> = new Set();
	pipeSet: Set<Function> = new Set();

	registerView(classRef: Function): void {
		this.viewSet.add(classRef);
	}
	registerComponent(classRef: Function): void {
		this.componentSet.add(classRef);
	}
	registerService(classRef: Function): void {
		this.serviceSet.add(classRef);
	}
	registerDirective(classRef: Function): void {
		this.directiveSet.add(classRef);
	}
	registerPipe(classRef: Function): void {
		this.pipeSet.add(classRef);
	}

	hasComponet<T>(selector: string): boolean {
		for (const modelClass of this.componentSet) {
			const componentRef: ComponentRef<T> =
				getBootstrapMatadata(modelClass.prototype);
			if (componentRef.selector === selector) {
				return true;
			}
		}
		return false;
	}
	getComponentRef<T>(selector: string): ComponentRef<T> | undefined {
		for (const modelClass of this.componentSet) {
			const componentRef: ComponentRef<T> =
				getBootstrapMatadata(modelClass.prototype);
			if (componentRef.selector === selector) {
				return componentRef;
			}
		}
	}

	getComponet<T>(selector: string) {
		// this.componentSet.
		for (const modelClass of this.componentSet) {
			const componentRef: ComponentRef<T> =
				getBootstrapMatadata(modelClass.prototype);
			if (componentRef.selector === selector) {
				return modelClass;
			}
		}
	}

	getComponetView(selector: string) {
		return this.getComponentRef(selector)?.viewClass;
	}

	hasOutput<T>(model: Object, eventName: string): PropertyRef | boolean {
		if (Reflect.has(model, 'bootstrap')) {
			const componentRef: ComponentRef<T> = Reflect.get(model, 'bootstrap');
			if (componentRef.outputs) {
				for (const out of componentRef.outputs) {
					if (out.viewAttribute === eventName) {
						return out;
					}
				}
			}
		}
		return false;
	}

	hasDirective<T>(selector: string): boolean {
		for (const directiveClass of this.directiveSet) {
			const directiveRef: DirectiveRef<T> =
				getBootstrapMatadata(directiveClass.prototype);
			if (directiveRef.selector === selector) {
				return true;
			}
		}
		return false;
	}

	getDirectiveRef<T>(selector: string): DirectiveRef<T> | undefined {
		for (const directiveClass of this.directiveSet) {
			const directiveRef: DirectiveRef<T> =
				getBootstrapMatadata(directiveClass.prototype);
			if (directiveRef.selector === selector) {
				return directiveRef;
			}
		}
	}
}