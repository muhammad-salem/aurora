import { Directive, Input, OnDestroy, StructuralDirective, Type } from '@ibyar/aurora';


@Directive({
	selector: '*component-outlet',
})
export class ComponentOutlet<C extends {}> extends StructuralDirective implements OnDestroy {


	@Input()
	set component(componentType: Type<C> | undefined) {
		this.viewContainerRef.clear();
		if (!componentType) {
			return;
		}
		this.viewContainerRef.createComponent<C>(componentType);
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}

}
