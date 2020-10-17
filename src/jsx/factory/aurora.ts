import {
    ElementNode, DirectiveNode, AuroraChild,
    BaseNode, FragmentNode, parseTextChild, AuroraNode
} from '../node/nodes.js';

export interface NodeAttr {
    [attr: string]: string;
}

export namespace Aurora {

    export const Fragment = 'fragment';

    export const CommentTag = 'comment';

    export const DirectiveTag = 'directive';

    export const StructuralDirectives = [
        'if',
        'for',
        'while'
    ];

    export function createElement(tagName: string, attrs?: NodeAttr, ...children: (string | AuroraChild)[]): AuroraNode {

        if (Fragment === tagName.toLowerCase()) {
            return createFragmentNode(...children);
        }
        /**
         * structural directive -- jsx support
         * 
         * <if condition="element.show"> {'{{element.name}}'} </if>
         * <div _if="element.show">{'{{element.name}}'} </div>
         */
        if (StructuralDirectives.includes(tagName)) {
            return createDirectiveNode(tagName, '', attrs, ...children);
        }
        /**
         * <directive *if="element.show" >{'{{element.name}}'}</directive>
         */
        if (DirectiveTag === tagName.toLocaleLowerCase() && attrs) {
            if (attrs) {
                let directiveName = Object.keys(attrs).find(attrName => attrName.startsWith('*'));
                let directiveValue: string;

                if (directiveName) {
                    // is directive
                    directiveValue = attrs[directiveName];
                    delete attrs.directiveName;
                    return createDirectiveNode(directiveName, directiveValue, attrs, ...children);
                }
                let node = new ElementNode(tagName, attrs?.is);
                initElementAttrs(node, attrs);
                children?.forEach(child => {
                    if (typeof child === 'string') {
                        node.addTextChild(child)
                    } else {
                        node.addChild(child);
                    }
                });
                return node;
            } else {
                // return new CommentNode('empty directive');
                return createFragmentNode(...children);
            }
        }
        // let node: ElementNode | DirectiveNode = new ElementNode(tagName, attrs?.is);
        if (attrs) {
            let node = createElementNode(tagName, attrs, ...children);
            const attrKeys = Object.keys(attrs);
            let directiveName = attrKeys.find(attrName => attrName.startsWith('*'));
            if (directiveName) {
                let directiveValue = attrs[directiveName];
                return createDirectiveNode(directiveName, directiveValue, attrs, node);
            }
            return node;
        } else {
            return createElementNode(tagName, attrs, ...children);
        }
    }

    export function createElementNode(tagName: string, attrs?: NodeAttr, ...children: (string | AuroraChild)[]) {
        let node = new ElementNode(tagName, attrs?.is);
        initElementAttrs(node, attrs);
        children?.forEach(child => {
            if (typeof child === 'string') {
                node.addTextChild(child)
            } else {
                node.addChild(child);
            }
        });
        return node;
    }

    export function createFragmentNode(...children: (string | AuroraChild)[]) {
        let childStack = children.flatMap(child => {
            if (typeof child === 'string') {
                return parseTextChild(child);
            } else {
                return [child];
            }
        });
        return new FragmentNode(childStack);
    }

    export function createDirectiveNode(directiveName: string, directiveValue: string, attrs?: NodeAttr, ...children: (string | AuroraChild)[]) {
        const directive = new DirectiveNode(directiveName, directiveValue);
        initElementAttrs(directive, attrs);
        children?.forEach(child => (typeof child === 'string') ? directive.addTextChild(child) : directive.addChild(child));
        return directive;
    }

    export function initElementAttrs(element: BaseNode, attrs?: NodeAttr) {
        if (attrs) {
            Object.keys(attrs).forEach(key => {
                handelAttribute(element, key, attrs[key]);
            });
        }
    }

    export function handelAttribute(element: BaseNode, attrName: string, value: string | Function | object): void {

        if (attrName.startsWith('#')) {
            // <app-tag #element-name="directiveName?" ></app-tag>
            attrName = attrName.substring(1);
            element.setTemplateRefName(attrName, value as string);
        }
        else if (attrName === 'is') {
            return;
        }
        else if (attrName.startsWith('[(')) {
            // [(attr)]="modelProperty"
            attrName = attrName.substring(2, attrName.length - 2);
            element.addInput(attrName, value as string);
            element.addOutput(attrName, value as string);
        }
        else if (attrName.startsWith('$') && typeof value === 'string' && value.startsWith('$')) {
            // $attr="$viewProperty" 
            attrName = attrName.substring(1);
            value = value.substring(1);
            element.addInput(attrName, value as string);
            element.addOutput(attrName, value as string);
        }
        else if (attrName.startsWith('[')) {
            // [attr]="modelProperty"
            attrName = attrName.substring(1, attrName.length - 1);
            element.addInput(attrName, value as string);
        }
        else if (attrName.startsWith('$') && typeof value === 'string') {
            // $attr="viewProperty" 
            attrName = attrName.substring(1);
            element.addInput(attrName, value as string);
        }
        else if (attrName.startsWith('$') && typeof value === 'object') {
            // $attr={viewProperty} // as an object
            attrName = attrName.substring(1);
            element.addAttribute(attrName, value);
        }
        else if (typeof value === 'string' && value.startsWith('$')) {
            // bad practice
            // attr="$viewProperty" // as an object

            // value = value.substring(1);
            // element.addAttribute(attrName, value);
            return;
        }
        else if (typeof value === 'string' && (/^\{\{(.+\w*)*\}\}/g).test(value)) {
            // attr="{{viewProperty}}" // just pass data
            value = value.substring(2, value.length - 2);
            element.addInput(attrName, value);
        }
        else if (typeof value === 'string' && (/\{\{|\}\}/g).test(value)) {
            // attr="any string{{viewProperty}}any text" // just pass data
            element.addTemplateAttr(attrName, value);
        }
        else if (attrName.startsWith('(')) {
            // (elementAttr)="modelProperty()"
            attrName = attrName.substring(1, attrName.length - 1);
            element.addOutput(attrName, value as string);
        }
        else if (attrName.startsWith('on')) {
            // onAttr="modelProperty()"
            // onAttr={modelProperty} // as an function
            element.addOutput(attrName.substring(2), value as string);
        }
        else {
            element.addAttribute(attrName, value);
        }
    }

}
