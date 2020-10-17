import { DirectiveNode, ElementNode } from '@aurorats/jsx';
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
	status: boolean = false;

	// constructor(
	// 	render: ComponentRender<T>,
	// 	comment: Comment,
	// 	directive: DirectiveNode) {
	// 	super(render, comment, directive);
	// 	this.status = false;
	// }

	onInit(): void {
		// this.status = false;
		//TODO better api
		console.log(`#onInit ${this.directive.directiveName}="${this.directive.directiveValue}"`);
		this.element = this.render.createElement(this.directive.children[0] as ElementNode);
		const propertySrc = this.render.getPropertySource(this.directive.directiveValue);
		let expNodeDown = parseJSExpression(`model.${this.directive.directiveValue}`);
		let context = {
			model: propertySrc.src
		};
		let callback1 = () => {
			this.condition = expNodeDown.get(context);
			this._updateView();
		};
		subscribe1way(propertySrc.src, propertySrc.property, this, 'condition', callback1);
		callback1();
	}

	private _updateView() {
		if (this.condition) {
			if (!this.status) {
				this.comment.after(this.element);
				this.status = true;
			}
		} else {
			this.element.remove();
			this.status = false;
		}
	}

}
