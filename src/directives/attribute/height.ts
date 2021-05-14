import { AttributeDirective, Directive, Input } from '@ibyar/core';

@Directive({
	selector: 'height'
})
export class HeightDirective extends AttributeDirective {

	_height: string;

	@Input()
	set height(height: string) {
		this._height = height;
		this.el.style.height = height;
	}

}
