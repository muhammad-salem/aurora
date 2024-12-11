import { Directive, input, OnDestroy, StructuralDirective } from '@ibyar/aurora';


export interface RouteData { selector: string, is?: string };

@Directive({
	selector: '*router-outlet',
})
export class RouterOutlet extends StructuralDirective implements OnDestroy {

	data = input.required({
		transform: (routeData?: RouteData) => {
			this.viewContainerRef.clear();
			routeData && this.viewContainerRef.createComponent(routeData.selector);
		},
	});

	onDestroy() {
		this.viewContainerRef.clear();
	}

}
