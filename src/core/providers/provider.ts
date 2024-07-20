import type { MetadataClass } from '@ibyar/decorators';
import type {
	ComponentRef, DirectiveRef, PipeRef, ServiceRef
} from '../component/component.js';
import { ReflectComponents, type PropertyRef } from '../component/reflect.js';
export type ProviderType = 'component' | 'service' | 'directive' | 'pipe' | 'self';

export class ClassRegistry {
	viewSet: Set<MetadataClass> = new Set();
	componentSet: Set<MetadataClass> = new Set();
	injectableSet: Set<MetadataClass> = new Set();
	directiveSet: Set<MetadataClass> = new Set();
	pipeSet: Set<MetadataClass> = new Set();

	registerView(classRef: MetadataClass): void {
		this.viewSet.add(classRef);
	}
	registerComponent(classRef: MetadataClass): void {
		this.componentSet.add(classRef);
	}
	registerInjectable(classRef: MetadataClass): void {
		this.injectableSet.add(classRef);
	}
	registerDirective(classRef: MetadataClass): void {
		this.directiveSet.add(classRef);
	}
	registerPipe(classRef: MetadataClass): void {
		this.pipeSet.add(classRef);
	}

	hasComponent<T>(selector: string): boolean {
		for (const modelClass of this.componentSet) {
			const componentRef = ReflectComponents.getMetaDate(modelClass) as ComponentRef<T>;
			if (componentRef.selector === selector) {
				return true;
			}
		}
		return false;
	}
	getComponentRef<T>(selector: string): ComponentRef<T> | undefined {
		for (const modelClass of this.componentSet) {
			const componentRef = ReflectComponents.getMetaDate(modelClass) as ComponentRef<T>;
			if (componentRef.selector === selector) {
				return componentRef;
			}
		}
		return;
	}

	getComponent<T>(selector: string) {
		for (const modelClass of this.componentSet) {
			const componentRef = ReflectComponents.getMetaDate(modelClass) as ComponentRef<T>;
			if (componentRef.selector === selector) {
				return modelClass;
			}
		}
		return;
	}

	getComponentView(selector: string) {
		return this.getComponentRef(selector)?.viewClass;
	}

	hasOutput<T>(model: Object, eventName: string): PropertyRef | false {
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
	hasInput<T>(model: Object, eventName: string): PropertyRef | false {
		if (Reflect.has(model, 'bootstrap')) {
			const componentRef: ComponentRef<T> = Reflect.get(model, 'bootstrap');
			if (componentRef.inputs) {
				for (const input of componentRef.inputs) {
					if (input.viewAttribute === eventName) {
						return input;
					}
				}
			}
		}
		return false;
	}

	hasDirective<T>(selector: string): boolean {
		for (const directiveClass of this.directiveSet) {
			const directiveRef = ReflectComponents.getMetaDate(directiveClass) as DirectiveRef<T>;
			if (directiveRef.selector === selector) {
				return true;
			}
		}
		return false;
	}

	directiveHasInput<T>(input: string, directiveType: 'attributes' | 'structural' = 'attributes'): boolean {
		for (const directiveClass of this.directiveSet) {
			const directiveRef = ReflectComponents.getMetaDate(directiveClass) as DirectiveRef<T>;
			if ((directiveType === 'attributes' && !directiveRef.selector.startsWith('*'))
				|| (directiveType === 'structural' && directiveRef.selector.startsWith('*'))) {
				if (directiveRef.inputs?.filter(ref => ref.viewAttribute === input).length > 0) {
					return true;
				}
			}
		}
		return false;
	}

	getDirectiveRef<T>(selector: string): DirectiveRef<T> | undefined {
		for (const directiveClass of this.directiveSet) {
			const directiveRef = ReflectComponents.getMetaDate(directiveClass) as DirectiveRef<T>;
			if (directiveRef.selector === selector) {
				return directiveRef;
			}
		}
		return undefined;
	}


	getPipe<T>(pipeName: string): PipeRef<T> | undefined {
		for (const pipeClass of this.pipeSet) {
			const pipeRef = ReflectComponents.getMetaDate(pipeClass) as PipeRef<T>;
			if (pipeRef.name === pipeName) {
				return pipeRef;
			}
		}
		return undefined;
	}

	getService<T>(serviceName: string): ServiceRef<T> | undefined {
		for (const serviceClass of this.injectableSet) {
			const serviceRef = ReflectComponents.getMetaDate(serviceClass) as ServiceRef<T>;
			if (serviceRef.name === serviceName) {
				return serviceRef;
			}
		}
		return undefined;
	}
}

export const classRegistryProvider = new ClassRegistry();
