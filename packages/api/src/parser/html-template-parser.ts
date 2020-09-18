
import {
    JsxFactory, jsxAttrComponentBuilder, JsxAttrComponent,
    JsxComponent, JSXRender
} from '@aurorats/jsx';
import { parseHtmlToJsxComponent } from '@aurorats/html-parser';

export function toJsxAttrComponent(html: string): JsxAttrComponent {
    // should render her all the variables and resolve binding
    let comp = parseHtmlToJsxComponent(html) as JsxComponent;
    const children = comp.children as (string | JsxComponent)[] || [];
    comp = JsxFactory.createElement(comp.tagName, comp.attributes, ...children);
    let attrComponent = jsxAttrComponentBuilder(comp);
    return attrComponent;
}

export function toJSXRender<T>(html: string): JSXRender<T> {
    // should render her all the variables and resolve binding
    let comp = parseHtmlToJsxComponent(html) as JsxComponent;
    const children = comp.children as (string | JsxComponent)[] || [];
    comp = JsxFactory.createElement(comp.tagName, comp.attributes, ...children);
    // model: T, never used, as it is a jsx thing
    return (model: T) => comp;
}
