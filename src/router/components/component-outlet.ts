import { Directive, input, OnDestroy, StructuralDirective, Type } from '@ibyar/core';


@Directive({
	selector: '*component-outlet',
})
export class ComponentOutlet<C extends {}> extends StructuralDirective implements OnDestroy {

	component = input.required({
		transform: (componentType?: Type<C>) => {
			this.viewContainerRef.clear();
			componentType && this.viewContainerRef.createComponent<C>(componentType);
		}
	});

	onDestroy() {
		this.viewContainerRef.clear();
	}

}
