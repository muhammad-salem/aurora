
import { HTMLComponent } from '../component/custom-element.js';
import { TemplateRef } from '../linker/template-ref.js';
import { ViewContainerRef } from '../linker/view-container-ref.js';
import { AuroraZone } from '../zone/zone.js';

/**
 * A structural directive selector as '*if' '*for'
 */
export class StructuralDirective {
	constructor(
		protected templateRef: TemplateRef,
		protected viewContainerRef: ViewContainerRef,
		protected host: HTMLComponent<any> | StructuralDirective,
		protected _zone: AuroraZone,
		private successors: Record<string, TemplateRef>,
	) { }

	getSuccessor(name: string): TemplateRef | undefined {
		return this.successors[name];
	}

}

/**
 * An attributes directive selector as '[class] [style]'
 */
export class AttributeDirective {
	constructor(protected el: HTMLElement, protected _zone: AuroraZone) { }
}

/**
 * An attributes directive on structural directive
 */
export class AttributeOnStructuralDirective {
	constructor(protected directive: StructuralDirective, protected _zone: AuroraZone) { }
}
