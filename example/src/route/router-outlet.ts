import { Directive, Input, Metadata, MetadataContext, OnDestroy, StructuralDirective } from '@ibyar/aurora';


export interface RouteData { selector: string, is?: string };

@Directive({
	selector: '*router-outlet',
})
export class RouterOutlet extends StructuralDirective implements OnDestroy {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	@Input()
	set routeData(routeData: RouteData | undefined) {
		this.viewContainerRef.clear();
		if (!routeData) {
			return;
		}
		this.viewContainerRef.createComponent(routeData.selector);
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}
}
