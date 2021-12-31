import { Directive, EmbeddedViewRefImpl, Input, OnDestroy, StructuralDirective } from '@ibyar/aurora';


@Directive({
	selector: '*router-outlet',
})
export class RouterOutlet extends StructuralDirective implements OnDestroy {

	@Input()
	set selector(selector: string) {
		this.viewContainerRef.clear();
		if (!selector) {
			return;
		}
		const el = document.createElement(selector);
		this.viewContainerRef.insert(new EmbeddedViewRefImpl<{}>({}, [el]));
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}
}
