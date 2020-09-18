import { JsxFactory } from '@aurorats/jsx';
import { JsxComponent, JsxAttributes, JSXRender } from '@aurorats/jsx';

export function htmlTemplateToJSXRender<T>(template: HTMLTemplateElement | string): JSXRender<T> {
    // should render her, all variables and resolve binding
    let temp: HTMLTemplateElement;
    if (typeof template === 'string') {
        // bad practice, all attributes will be lowercase names
        temp = document.createElement('template');
        temp.innerHTML = template;
        template = temp;
    } else {
        temp = template;
    }
    let renderComponent = htmlTemplateParser(temp) as JsxComponent;
    // model: T, never used, as it is a jsx thing
    return (model: T) => renderComponent;
}

export function htmlTemplateParser(template: HTMLTemplateElement): JsxComponent | undefined {
    if (template.content.childNodes.length == 0) {
        return undefined;
    } else if (template.content.childNodes.length === 1) {
        const child = template.content.firstChild;
        if (child instanceof Text) {
            return JsxFactory.createElement(JsxFactory.Fragment, undefined, child.textContent as string);
        } else if (child instanceof HTMLElement) {
            return createComponent(child) as JsxComponent;
        }
    } else if (template.content.childNodes.length > 1) {
        const children = [].slice.call(template.content.childNodes)
            .map(item => createComponent(item))
            .filter(component => component !== null);
        return JsxFactory.createElement(JsxFactory.Fragment, undefined, ...children as (string | JsxComponent)[]);
    }
    return undefined;
}

function toJsxAttributes(attributes: NamedNodeMap): JsxAttributes {
    const attrs: JsxAttributes = {};
    Array.prototype.slice.call(attributes).forEach((attr: Attr) => {
        attrs[attr.name] = attr.value;
    });
    return attrs;
}

function createComponent(child: ChildNode): string | JsxComponent | null {
    if (child instanceof Text) {
        return child.textContent;
    } else if (child instanceof Comment) {
        return JsxFactory.createElement(JsxFactory.CommentTag, { comment: child.textContent });
    } else {
        const element: HTMLElement = child as HTMLElement;
        const children = [].slice.call(element.childNodes)
            .map(item => createComponent(item))
            .filter(component => component !== null);
        return JsxFactory.createElement(
            element.tagName.toLowerCase(),
            toJsxAttributes(element.attributes),
            ...children as (string | JsxComponent)[]
        );
    }
}
