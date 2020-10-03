import { JsxAttrComponent } from '@aurorats/jsx';
import {
	ComponentRender, Directive, OnInit,
	StructuralDirective, subscribe1way
} from '@aurorats/api';
import { parseJSExpression } from '@aurorats/expression';


@Directive({
	selector: '*if',
})
export class IfDirective<T> extends StructuralDirective<T> implements OnInit {

	condition: boolean;
	element: HTMLElement;

	constructor(
		render: ComponentRender<T>,
		comment: Comment,
		statement: string,
		component: JsxAttrComponent) {
		super(render, comment, statement, component);
	}

	onInit(): void {
		console.log('IfDirective#onInit()');
		this.element = this.render.createElement(this.component) as HTMLElement;
		const propertySrc = this.render.getPropertySource(this.statement);
		let expNodeDown = parseJSExpression(`element.condition = model.${this.statement}`);
		let context = {
			element: this,
			model: propertySrc.src
		};
		let callback1 = () => {
			expNodeDown.get(context);
			this._updateView();
		};
		subscribe1way(propertySrc.src, propertySrc.property, this, 'condition', callback1);
		callback1();
	}

	private _updateView() {
		if (this.condition) {
			this.comment.after(this.element);
		} else {
			this.element.remove();
		}
	}

}
