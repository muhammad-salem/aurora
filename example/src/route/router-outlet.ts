import { Directive, Input, OnDestroy, StructuralDirective } from '@ibyar/aurora';


export interface RouteData { selector: string, is?: string };

@Directive({
	selector: '*router-outlet',
})
export class RouterOutlet extends StructuralDirective implements OnDestroy {

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
