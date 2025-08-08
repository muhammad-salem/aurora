import {
	Component, ComponentViewRef, Directive, input,
	OnDestroy, StructuralDirective, Type, viewChild
} from '@ibyar/core';


@Component({
	selector: 'lazy-hidden-view',
	template: `<div #hidden style="display: none"><div></div></div>`
})
export class LazyHiddenViewComponent implements OnDestroy {

	private hidden = viewChild('hidden');

	hide(nativeElement: HTMLElement) {
		const div = this.hidden.get() as HTMLDivElement & { moveBefore?: (node: Node, child: ChildNode) => void };
		if (div.moveBefore && div.lastChild) {
			div.moveBefore(nativeElement, div.lastChild);
		} else if (div.lastChild) {
			div.lastChild.before(nativeElement);
		}
	}
	onDestroy(): void {
		this.hidden.get().innerHTML = '';
	}

}


@Directive({
	selector: '*lazy-outlet',
	imports: [LazyHiddenViewComponent]
})
export class LazyOutletComponent<C extends {}> extends StructuralDirective implements OnDestroy {

	private viewRef = new Map<Type<C>, ComponentViewRef<C>>();
	private hiddenView = this.viewContainerRef.createComponent(LazyHiddenViewComponent);
	private currentType: Type<C> | undefined;

	component = input.required({
		transform: (componentType?: Type<C>) => {
			if (componentType === this.currentType) {
				return;
			}
			const ref = this.viewRef.get(this.currentType!);
			if (ref) {
				const index = this.viewContainerRef.indexOf(ref.viewRef);
				this.viewContainerRef.remove(index, false);
				this.hiddenView.instance.hide(ref.nativeElement);
			}
			if (this.viewRef.has(componentType!) && componentType) {
				const oldView = this.viewRef.get(componentType)!;
				this.viewContainerRef.adopt(oldView.viewRef);
				this.currentType = componentType;
			} else if (componentType) {
				const newRef = this.viewContainerRef.createComponent<C>(componentType);
				this.viewRef.set(componentType, newRef);
				this.currentType = componentType;
			} else {
				this.currentType = undefined;
			}
		}
	});

	onDestroy() {
		this.viewContainerRef.clear();
	}

}
