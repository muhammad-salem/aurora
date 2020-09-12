
import {
	AttrDiscription, JsxAttrComponent,
	JsxAttributes, JsxComponent
} from './factory-types.js';

export class JsxFactory {

	static Fragment = 'fragment';

	static CommentTag = 'comment';

	static Directive = 'directive';

	static createElement(tagName: string, attributes: JsxAttributes | undefined, ...children: (string | JsxComponent)[]): JsxComponent {
		if (attributes) {
			const keys = Object.keys(attributes);
			let directive = keys.find(key => key.startsWith('*')) || keys.find(key => key === '#directive');
			if (directive) {
				let directiveValue: string = attributes[directive];
				if (directive.startsWith('#')) {
					let temp = directiveValue.split('|', 2);
					Reflect.deleteProperty(attributes, directive);
					directive = temp[0];
					directiveValue = temp[1];
				} else {
					directiveValue = attributes[directive];
					Reflect.deleteProperty(attributes, directive);
				}
				return {
					tagName: JsxFactory.Directive,
					attributes: {
						directiveName: directive,
						directiveValue: directiveValue,
						component: {
							tagName: tagName,
							attributes,
							children
						}
					}
				}
			}
		}
		return {
			tagName: tagName,
			attributes,
			children
		};
	}
}


export function jsxAttrComponentBuilder(component: JsxComponent): JsxAttrComponent {
	const jsxAttrComponent: JsxAttrComponent = new JsxAttrComponent(component.tagName);
	if (component.attributes) {
		jsxAttrComponent.attributes = jsxComponentAttrHandler(component.attributes);
	}

	if (component.children) {
		jsxAttrComponent.children = component.children
			.map(child => {
				if (typeof child === 'object') {
					return jsxAttrComponentBuilder(child);
				} else {
					return child;
				};
			});
	}
	return jsxAttrComponent;
}

export function jsxComponentAttrHandler(componentAttr: JsxAttributes): AttrDiscription {
	const attr = new AttrDiscription();
	Object.keys(componentAttr).forEach(attrName => {
		handelAttribute(attr, attrName, componentAttr[attrName]);
	});
	return attr;
}

function handelAttribute(discr: AttrDiscription, attr: string, value: string | Function | object) {

	if (attr.startsWith('#')) {
		// <app-tag #element-name="directiveName?" ></app-tag>
		attr = attr.substring(1);
		if (value === 'true') {
			discr.elementName = attr;
		} else if (typeof value === 'string') {
			discr.directiveName = attr;
			let temp = value.split('|', 2);
			discr.directive = temp[0];
			discr.directiveValue = temp[1];
		}
	}
	else if (attr === 'is') {
		discr.setAttrIs(value as string);
	}
	else if (attr === 'comment') {
		discr.setComment(value as string);
	}
	else if (attr.startsWith('[(')) {
		// [(attr)]="modelProperty"
		attr = attr.substring(2, attr.length - 2);
		discr.addPropertyBinding(attr, value as string);
	}
	else if (attr.startsWith('$') && typeof value === 'string' && value.startsWith('$')) {
		// $attr="$viewProperty" 
		attr = attr.substring(1);
		value = value.substring(1);
		discr.addPropertyBinding(attr, value);
	}
	else if (attr.startsWith('[')) {
		// [attr]="modelProperty"
		attr = attr.substring(1, attr.length - 1);
		discr.addExpressionBinding(attr, value as string);
	}
	else if (attr.startsWith('$') && typeof value === 'string') {
		// $attr="viewProperty" 
		attr = attr.substring(1);
		discr.addExpressionBinding(attr, value);
	}
	else if (attr.startsWith('$') && typeof value === 'object') {
		// $attr={viewProperty} // as an object
		attr = attr.substring(1);
		discr.addObjectRecord(attr, value);
	}
	else if (typeof value === 'string' && value.startsWith('$')) {
		// bad practice
		// attr="$viewProperty" // as an object
		value = value.substring(1);
		discr.addLessbinding(attr, value);
	}
	else if (typeof value === 'string' && (/^\{\{(.+\w*)*\}\}/g).test(value)) {
		// attr="{{viewProperty}}" // just pass data
		value = value.substring(2, value.length - 2);
		discr.addExpressionBinding(attr, value);
	}
	else if (typeof value === 'string' && (/\{\{|\}\}/g).test(value)) {
		// attr="any string{{viewProperty}}any text" // just pass data
		discr.addTemplate(attr, value);
	}
	else if (attr.startsWith('(')) {
		// (elementAttr)="modelProperty()"
		attr = attr.substring(1, attr.length - 1);
		discr.addEventRecord(attr, value as string);
	}
	else if (attr.startsWith('on')) {
		// onattr="modelProperty()"
		// onattr={modelProperty} // as an function
		discr.addEventRecord(attr, value as (string | Function));
	}
	else {
		discr.addAttr(attr, value);
	}
}

