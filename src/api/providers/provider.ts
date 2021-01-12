
import { getBootstrapMetadata } from '@ibyar/metadata';
import { ComponentRef, DirectiveRef, PipeRef, PropertyRef, ServiceRef } from '../component/component.js';

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

	hasComponent<T>(selector: string): boolean {
		for (const modelClass of this.componentSet) {
			const componentRef: ComponentRef<T> =
				getBootstrapMetadata(modelClass.prototype);
			if (componentRef.selector === selector) {
				return true;
			}
		}
		return false;
	}
	getComponentRef<T>(selector: string): ComponentRef<T> | undefined {
		for (const modelClass of this.componentSet) {
			const componentRef: ComponentRef<T> =
				getBootstrapMetadata(modelClass.prototype);
			if (componentRef.selector === selector) {
				return componentRef;
			}
		}
	}

	getComponent<T>(selector: string) {
		// this.componentSet.
		for (const modelClass of this.componentSet) {
			const componentRef: ComponentRef<T> =
				getBootstrapMetadata(modelClass.prototype);
			if (componentRef.selector === selector) {
				return modelClass;
			}
		}
	}

	getComponentView(selector: string) {
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
				getBootstrapMetadata(directiveClass.prototype);
			if (directiveRef.selector === selector) {
				return true;
			}
		}
		return false;
	}

	getDirectiveRef<T>(selector: string): DirectiveRef<T> | undefined {
		for (const directiveClass of this.directiveSet) {
			const directiveRef: DirectiveRef<T> =
				getBootstrapMetadata(directiveClass.prototype);
			if (directiveRef.selector === selector) {
				return directiveRef;
			}
		}
		return undefined;
	}

	getPipe<T>(pipeName: string): PipeRef<T> | undefined {
		for (const pipeClass of this.pipeSet) {
			const pipeRef: PipeRef<T> = getBootstrapMetadata(pipeClass.prototype);
			if (pipeRef.name === pipeName) {
				return pipeRef;
			}
		}
		return undefined;
	}

	getService<T>(servicName: string): ServiceRef<T> | undefined {
		for (const servicClass of this.serviceSet) {
			const servicRef: ServiceRef<T> = getBootstrapMetadata(servicClass.prototype);
			if (servicRef.name === servicName) {
				return servicRef;
			}
		}
		return undefined;
	}
}

export const ClassRegistryProvider = new ClassRegistry();
export default ClassRegistryProvider;
