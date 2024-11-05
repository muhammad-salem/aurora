
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
