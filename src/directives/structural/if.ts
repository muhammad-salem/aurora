import { ElementNode } from '@ibyar/jsx';
import {
	Directive, OnInit, SourceFollowerCallback,
	StructuralDirective, subscribe1way
} from '@ibyar/api';
import { parseJSExpression } from '@ibyar/expression';


@Directive({
	selector: '*if',
})
export class IfDirective<T> extends StructuralDirective<T> implements OnInit {

	condition: boolean;
	element: HTMLElement;

	onInit(): void {
		const conditionNode = parseJSExpression(this.directive.directiveValue);
		const propertyMaps = this.render.getPropertyMaps(conditionNode, this.parentContextStack);
		const proxyContext = this.render.createProxyObject(propertyMaps, this.parentContextStack);

		const callback1: SourceFollowerCallback = (stack: any[]) => {
			this.condition = conditionNode.get(proxyContext);
			this._updateView();
			stack.push(this);
		};

		propertyMaps.forEach(propertyMap => {
			const context = propertyMap.provider.getContext(propertyMap.entityName);
			if (context) {
				subscribe1way(context, propertyMap.entityName as string, this, 'condition', callback1);
			}
		});

		callback1([]);
	}

	private _updateView() {
		if (this.condition) {
			if (!this.element) {
				this.element = this.render.createElement(this.directive.children[0] as ElementNode, this.parentContextStack);
				this.comment.after(this.element);
			}
		}
		else if (this.element) {
			this.element.remove();
			Reflect.set(this, 'element', undefined);
		}
	}

}
