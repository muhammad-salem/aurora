
import {
	AttrDescription, JsxAttrComponent,
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

export function jsxComponentAttrHandler(componentAttr: JsxAttributes): AttrDescription {
	const attr = new AttrDescription();
	Object.keys(componentAttr).forEach(attrName => {
		handelAttribute(attr, attrName, componentAttr[attrName]);
	});
	return attr;
}

function handelAttribute(descriptor: AttrDescription, attr: string, value: string | Function | object) {

	if (attr.startsWith('#')) {
		// <app-tag #element-name="directiveName?" ></app-tag>
		attr = attr.substring(1);
		if (value === 'true') {
			descriptor.elementName = attr;
		} else if (typeof value === 'string') {
			descriptor.directiveName = attr;
			let temp = value.split('|', 2);
			descriptor.directive = temp[0];
			descriptor.directiveValue = temp[1];
		}
	}
	else if (attr === 'is') {
		descriptor.setAttrIs(value as string);
	}
	else if (attr === 'comment') {
		descriptor.setComment(value as string);
	}
	else if (attr.startsWith('[(')) {
		// [(attr)]="modelProperty"
		attr = attr.substring(2, attr.length - 2);
		descriptor.addPropertyBinding(attr, value as string);
	}
	else if (attr.startsWith('$') && typeof value === 'string' && value.startsWith('$')) {
		// $attr="$viewProperty" 
		attr = attr.substring(1);
		value = value.substring(1);
		descriptor.addPropertyBinding(attr, value);
	}
	else if (attr.startsWith('[')) {
		// [attr]="modelProperty"
		attr = attr.substring(1, attr.length - 1);
		descriptor.addExpressionBinding(attr, value as string);
	}
	else if (attr.startsWith('$') && typeof value === 'string') {
		// $attr="viewProperty" 
		attr = attr.substring(1);
		descriptor.addExpressionBinding(attr, value);
	}
	else if (attr.startsWith('$') && typeof value === 'object') {
		// $attr={viewProperty} // as an object
		attr = attr.substring(1);
		descriptor.addObjectRecord(attr, value);
	}
	else if (typeof value === 'string' && value.startsWith('$')) {
		// bad practice
		// attr="$viewProperty" // as an object
		value = value.substring(1);
		descriptor.addLessBinding(attr, value);
	}
	else if (typeof value === 'string' && (/^\{\{(.+\w*)*\}\}/g).test(value)) {
		// attr="{{viewProperty}}" // just pass data
		value = value.substring(2, value.length - 2);
		descriptor.addExpressionBinding(attr, value);
	}
	else if (typeof value === 'string' && (/\{\{|\}\}/g).test(value)) {
		// attr="any string{{viewProperty}}any text" // just pass data
		descriptor.addTemplate(attr, value);
	}
	else if (attr.startsWith('(')) {
		// (elementAttr)="modelProperty()"
		attr = attr.substring(1, attr.length - 1);
		descriptor.addEventRecord(attr, value as string);
	}
	else if (attr.startsWith('on')) {
		// onattr="modelProperty()"
		// onattr={modelProperty} // as an function
		descriptor.addEventRecord(attr, value as (string | Function));
	}
	else {
		descriptor.addAttr(attr, value);
	}
}

