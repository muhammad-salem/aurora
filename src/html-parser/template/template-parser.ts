import {
    Aurora, AuroraChild, AuroraNode, CommentNode,
    ElementNode, FragmentNode, parseTextChild,
    TextNode
} from '@aurorats/jsx';


export class TemplateParser {

    parse(template: HTMLTemplateElement): AuroraNode {
        if (template.content.childNodes.length == 0) {
            return new FragmentNode([new TextNode('')]);
        } else if (template.content.childNodes.length === 1) {
            let node = this.createComponent(template.content.firstChild as ChildNode);
            if (Array.isArray(node)) {
                return new FragmentNode(node);
            } else {
                return node;
            }
        } else /* if (template.content.childNodes.length > 1)*/ {
            const children = [].slice.call(template.content.childNodes)
                .map(item => this.createComponent(item))
                .flatMap(function (toFlat): AuroraChild[] {
                    if (Array.isArray(toFlat)) {
                        return toFlat;
                    } else {
                        return [toFlat];
                    }
                });
            return new FragmentNode(children);
        }
    }

    createComponent(child: ChildNode) {
        if (child instanceof Text) {
            return parseTextChild(child.textContent || '');
        } else if (child instanceof Comment) {
            return new CommentNode(child.textContent || '');
        } else {
            /**
             * can't detect directives in template, as '*' not allowed as qualified attribute name
             * also all attributes names will be 'lower case'
             */
            const element: HTMLElement = child as HTMLElement;
            let node = new ElementNode(element.tagName.toLowerCase(), element.attributes.getNamedItem('is')?.value);
            let directiveAttr: Attr;
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes.item(i) as Attr;
                Aurora.handelAttribute(node, attr.name, attr.value);
            }
            const children = [].slice.call(element.childNodes)
                .map(item => this.createComponent(item));
            children.forEach(child => {
                if (Array.isArray(child)) {
                    child.forEach(text => node.addChild(text));
                }
                else {
                    node.addChild(child);
                }
            });
            return node;
        }
    }

    toAuroraRenderRootNode<T>(template: AuroraNode | HTMLTemplateElement | string) {
        if (typeof template === 'string') {
            let temp = document.createElement('template');
            temp.innerHTML = template;
            template = temp;
        } else if (template instanceof HTMLTemplateElement) {
            template = this.parse(template);
        }
        return ((model: T) => template);
    }
}

export const templateParser = new TemplateParser();
