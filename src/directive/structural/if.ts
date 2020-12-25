import { ElementNode } from '@aurorats/jsx';
import {
	Directive, OnInit,
	SourceFollwerCallback,
	StructuralDirective, subscribe1way
} from '@aurorats/api';
import { parseJSExpression } from '@aurorats/expression';


@Directive({
	selector: '*if',
})
export class IfDirective<T> extends StructuralDirective<T> implements OnInit {

	condition: boolean;
	element: HTMLElement;

	onInit(): void {
		// console.log(`${this.directive.directiveName}="${this.directive.directiveValue}"`);
		let conditionNode = parseJSExpression(this.directive.directiveValue);
		const entries = conditionNode.entry().map(key => this.render.getPropertySource(key));
		let context = {};
		let proxyContext = new Proxy<typeof context>(context, {
			get(target: typeof context, p: PropertyKey, receiver: any): any {
				const propertySrc = entries.find(src => src.property === p as string);
				return propertySrc?.src[p];
			},
			set(target: typeof context, p: PropertyKey, value: any, receiver: any): boolean {
				const propertySrc = entries.find(src => src.property === p as string);
				return Reflect.set(propertySrc?.src, p, value);
			}
		});

		const callback1: SourceFollwerCallback = (stack: any[]) => {
			this.condition = conditionNode.get(proxyContext);
			this._updateView();
			stack.push(this);
		};

		entries.forEach(propertySrc => {
			subscribe1way(propertySrc.src, propertySrc.property, this, 'condition', callback1);
		});

		callback1([]);
	}

	private _updateView() {
		if (this.condition) {
			if (!this.element) {
				this.element = this.render.createElement(this.directive.children[0] as ElementNode);
				this.comment.after(this.element);
			}
		}
		else if (this.element) {
			this.element.remove();
			Reflect.set(this, 'element', undefined);
		}
	}

}
