import { ContextProvider } from '@ibyar/expressions';
import { isOnInit } from '../component/lifecycle';
import { ClassRegistryProvider } from '../providers/provider';
import { AttributeDirective } from './directive';

type ElementContext = { this: HTMLElement } & { [key: string]: AttributeDirective | undefined; };

export class ElementContextProvider implements ContextProvider {

	private directiveMap: Map<string, AttributeDirective> = new Map();
	private context: ElementContext = {} as ElementContext;
	constructor(private el: HTMLElement) {
		this.context.this = el;
	}
	getElement() {
		return this.el;
	}
	getDirectives() {
		return this.directiveMap;
	}
	get(propertyKey: PropertyKey): any {
		if (propertyKey === 'this') {
			return this.el;
		}
		if (this.directiveMap.has(propertyKey as string)) {
			const directive = this.directiveMap.get(propertyKey as string)!;
			return directive;
		}
		for (const directive of this.directiveMap.values()) {
			if (propertyKey in directive) {
				return Reflect.get(directive, propertyKey);
			}
		}
		const directiveRef = ClassRegistryProvider.getDirectiveRef<any>(propertyKey as string);
		if (directiveRef && directiveRef.modelClass instanceof AttributeDirective) {
			const directive = new directiveRef.modelClass(this.el) as AttributeDirective;
			this.directiveMap.set(propertyKey as string, directive);
			this.context[propertyKey as string] = directive;
			if (isOnInit(directive)) {
				directive.onInit();
			}
			return Reflect.get(directive, propertyKey as string);
		}
		return void 0;
	}
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		if (propertyKey in this.el) {
			return Reflect.set(this.el, propertyKey, value);
		}
		if (this.directiveMap.has(propertyKey as string)) {
			const directive = this.directiveMap.get(propertyKey as string)!;
			return Reflect.set(directive, propertyKey, value);
		}
		for (const directive of this.directiveMap.values()) {
			if (propertyKey in directive) {
				return Reflect.set(directive, propertyKey, value);
			}
		}
		const directiveRef = ClassRegistryProvider.getDirectiveRef<any>(propertyKey as string);
		if (directiveRef && directiveRef.modelClass.prototype instanceof AttributeDirective) {
			const directive = new directiveRef.modelClass(this.el) as AttributeDirective;
			this.directiveMap.set(propertyKey as string, directive);
			const result = Reflect.set(directive, propertyKey, value);
			if (isOnInit(directive)) {
				directive.onInit();
			}
			return result;
		}
		return false;
	}
	has(propertyKey: string): boolean {
		if (propertyKey in this.context) {
			return true;
		}
		if (this.directiveMap.has(propertyKey)) {
			return true;
		}
		for (const directive of this.directiveMap.values()) {
			if (propertyKey in directive) {
				return true;
			}
		}
		if (ClassRegistryProvider.hasDirective(propertyKey)) {
			return true;
		}
		if (ClassRegistryProvider.directiveHasInput(propertyKey)) {
			return true;
		}
		return false;
	}
	getProviderBy(propertyKey: string): any {
		return this.context;
	}
}
