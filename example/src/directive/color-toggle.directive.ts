
import { Directive, HostListener, AttributeDirective } from '@ibyar/aurora';


@Directive({
	selector: 'color-toggle',
	exportAs: 'colorToggle'
})
export class ColorTogglerDirective extends AttributeDirective {

	@HostListener('mouseover')
	onMouseOver() {
		this.toggleColor();
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		this.toggleColor();
	}

	toggleColor() {
		let color = this.el.style.color;
		let colorToSet = (color == 'red') ? 'black' : 'red';
		this.el.style.color = colorToSet;
	}

}
