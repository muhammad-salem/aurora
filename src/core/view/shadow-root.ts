import { type CustomElement } from '../component/custom-element.js';
import { provide } from '../di/inject.js';

export class ShadowRootService {
	private shadowRoots = new WeakMap<CustomElement, ShadowRoot>();

	has(elem: CustomElement): boolean {
		return this.shadowRoots.has(elem);
	}

	get(elem: CustomElement): ShadowRoot | undefined {
		return this.shadowRoots.get(elem);
	}

	set(elem: CustomElement, root: ShadowRoot): void {
		this.shadowRoots.set(elem, root);
	}

}

provide(ShadowRootService);
