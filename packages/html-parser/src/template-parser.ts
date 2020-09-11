import { JsxAttributes, JsxComponent, JSXRender } from '@aurorats/types';

export function htmlTemplateToJSXRender<T>(template: HTMLTemplateElement | string): JSXRender<T> {
    // should render her, all variables and resolve binding
    let temp: HTMLTemplateElement;
    if (typeof template === 'string') {
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
            return { tagName: 'fragment', children: [(child.textContent as string).trim()] };
        } else if (child instanceof HTMLElement) {
            return createComponent(child) as JsxComponent;
        }
    } else if (template.content.childNodes.length > 1) {
        let root: JsxComponent = { tagName: 'fragment', children: [] };
        template.content.childNodes.forEach(item => {
            appendChildToElement(createComponent(item), root);
        });
        return root;
    }
    return undefined;
}

function appendChildToElement(childElement: string | JsxComponent, root: JsxComponent) {
    if (typeof childElement === 'string' && childElement.length == 0) {
        // do nothing
    }
    else {
        root.children?.push(childElement);
    }
}

function toJsxAttributes(attributes: NamedNodeMap): JsxAttributes {
    const attrs: JsxAttributes = {};
    Array.prototype.slice.call(attributes).forEach((attr: Attr) => {
        attrs[attr.name] = attr.value;
    });
    return attrs;
}

function createComponent(child: ChildNode): string | JsxComponent {
    if (child instanceof Text) {
        return (child.textContent as string).trim();
    } else if (child instanceof Comment) {
        return {
            tagName: 'comment',
            attributes: { comment: child.textContent }
        };
    } else {
        const element: HTMLElement = child as HTMLElement;
        let root: JsxComponent = {
            tagName: element.tagName.toLowerCase() as string,
            attributes: toJsxAttributes(element.attributes)
        };
        if (element.childNodes.length > 0) {
            root.children = [];
            element.childNodes.forEach(item => {
                appendChildToElement(createComponent(item), root);
            });
        }
        return root;
    }
}
