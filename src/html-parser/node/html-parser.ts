import { isEmptyElement } from '@aurorats/element';
import {
    ElementNode, CommentNode, parseTextChild,
    TextNode, LiveText, FragmentNode,
    DirectiveNode, AuroraNode, AuroraChild
} from '@aurorats/jsx';

type Token = (token: string) => Token;

type ChildNode = ElementNode | CommentNode | string;

export class NodeParser {

    private index: number;
    private stateFn: Token;

    private tagNameRegExp = /[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF]/;

    private childStack: AuroraChild[];
    private stackTrace: ChildNode[];

    private get currentNode(): ElementNode {
        return this.stackTrace[this.stackTrace.length - 1] as ElementNode;
    }

    private tempText: string;

    private propertyName: string;
    private propertyValue: string;
    private propType: 'attr' | 'ref-name' | 'input' | 'output' | 'two-way';

    parse(html: string)/*: AuroraNode*/ {
        this.reset();
        for (; this.index < html.length; this.index++) {
            this.stateFn = this.stateFn(html[this.index]);
        }
        if (this.tempText && this.stateFn === this.parseText) {
            this.stateFn('<');
        }
        if (this.stackTrace.length > 0) {
            console.error(this.stackTrace);
            throw new Error(`error parsing html, had ${this.stackTrace.length} element, with no closing tag`);
        }
        let stack = this.childStack;
        this.reset();
        return stack;
    }

    private reset() {
        this.index = 0;
        this.childStack = [];
        this.stackTrace = [];
        this.propType = 'attr';
        this.stateFn = this.parseText;
        this.propertyName = this.propertyValue = this.tempText = '';
    }

    private parseText(token: string) {
        if (token === '<') {
            if (this.tempText) {
                this.stackTrace.push(this.tempText);
                this.popElement();
                this.tempText = '';
            }
            return this.parseTag;
        }
        this.tempText += token;
        return this.parseText;
    }

    private parseTag(token: string) {
        if (token === '/') {
            return this.parseCloseTag;
        }
        if (token === '!') {
            return this.parseComment;
        }
        this.index--;
        return this.parseOpenTag;
    }

    private parseComment(token: string) {
        if (token === '-') {
            return this.parseComment;
        }
        else if (token === '>') {
            this.stackTrace.push(new CommentNode(this.tempText.trim()));
            this.popElement();
            this.tempText = '';
            return this.parseText;
        }
        this.tempText += token;
        return this.parseComment;
    }

    private parseCloseTag(token: string) {
        if (token === '>') {
            if (!isEmptyElement(this.currentNode.tagName) && this.currentNode.tagName !== this.tempText) {
                throw 'Wrong closed tag at char ' + this.index;
            }
            this.popElement();
            this.tempText = '';
            return this.parseText;
        }
        this.tempText += token;
        return this.parseCloseTag;
    }

    private parseOpenTag(token: string) {
        if (token === '>') {
            this.stackTrace.push(new ElementNode(this.tempText));
            if (isEmptyElement(this.tempText)) {
                this.popElement();
            }
            this.tempText = '';
            return this.parseText;
        }
        else if (this.tagNameRegExp.test(token)) {
            this.tempText += token;
            return this.parseOpenTag;
        }
        else if (/\s/.test(token)) {
            this.stackTrace.push(new ElementNode(this.tempText));
            this.tempText = '';
            this.propType = 'attr';
            return this.parsePropertyName;
        }
    }

    private parsePropertyName(token: string) {
        if (token === '>') {
            if (this.tempText.trim()) {
                this.propertyName = this.tempText;
                this.currentNode.addAttribute(this.propertyName, true);
                this.propertyName, this.propertyValue = this.tempText = '';
            }
            if (isEmptyElement(this.currentNode.tagName)) {
                this.popElement();
            }
            this.tempText = '';
            return this.parseText;
        }
        else if (token === '/') {
            return this.parsePropertyName;
        }
        else if (/\[/.test(token)) {
            this.propType = 'input';
            return this.parseInputOutput;
        }
        else if (/\(/.test(token)) {
            this.propType = 'output';
            return this.parseInputOutput;
        }
        else if (/#/.test(token)) {
            this.propType = 'ref-name';
            return this.parseRefName;
        }
        else if (/=/.test(token)) {
            this.propertyName = this.tempText;
            this.tempText = '';
            return this.parsePropertyName;
        } else if (/"/.test(token)) {
            return this.parsePropertyValue;
        } else if (/\d/.test(token)) {
            this.tempText += token;
            return this.parsePropertyValue;
        }
        else if (/\s/.test(token)) {
            if (this.tempText.trim()) {
                this.propertyName = this.tempText;
                this.currentNode.addAttribute(this.propertyName, true);
                this.propertyName, this.propertyValue = this.tempText = '';
            }
            return this.parsePropertyName;
        }
        this.tempText += token;
        return this.parsePropertyName;
    }



    private parseRefName(token: string) {
        if (/=/.test(token)) {
            return this.parseRefName;
        }
        else if (/"/.test(token)) {
            this.propertyName = this.tempText;
            this.tempText = '';
            return this.parsePropertyValue;
        } else if (/\s/.test(token)) {
            this.currentNode.setTemplateRefName(this.tempText, '');
            this.propertyName = this.tempText = '';
            return this.parsePropertyName;
        } else if (/>/.test(token)) {
            this.currentNode.setTemplateRefName(this.tempText, '');
            this.propertyName = this.tempText = '';
            return this.parseText;
        }
        this.tempText += token;
        return this.parseRefName;
    }

    private parseInputOutput(token: string) {
        if (/\(/.test(token)) {
            this.propType = 'two-way';
            return this.parseInputOutput;
        }
        else if (/\)|\]|=/.test(token)) {
            return this.parseInputOutput;
        }
        else if (/"/.test(token)) {
            this.propertyName = this.tempText;
            this.tempText = '';
            return this.parsePropertyValue;
        }
        this.tempText += token;
        return this.parseInputOutput;
    }

    private parsePropertyValue(token: string) {
        if (/"/.test(token)) {
            this.propertyValue = this.tempText;
            switch (this.propType) {
                case 'input':
                    this.currentNode.addInput(this.propertyName, this.propertyValue);
                    break;
                case 'output':
                    this.currentNode.addOutput(this.propertyName, this.propertyValue);
                    break;
                case 'two-way':
                    this.currentNode.addTwoWayBinding(this.propertyName, this.propertyValue);
                    break;
                case 'ref-name':
                    this.currentNode.setTemplateRefName(this.propertyName, this.propertyValue);
                    break;
                case 'attr':
                default:
                    if (/^([-+]?\d*\.?\d+)(?:[eE]([-+]?\d+))?$/.test(this.propertyValue.trim())) {
                        this.currentNode.addAttribute(this.propertyName, +this.propertyValue.trim());
                    } else if (/^(true|false)$/.test(this.propertyValue.trim().toLowerCase())) {
                        if (this.propertyValue.trim().toLowerCase() === 'true') {
                            this.currentNode.addAttribute(this.propertyName, true);
                        } else {
                            this.currentNode.addAttribute(this.propertyName, false);
                        }
                    }
                    else {
                        this.currentNode.addAttribute(this.propertyName, this.propertyValue);
                    }
            }
            this.propertyName, this.propertyValue = this.tempText = '';
            this.propType = 'attr';
            return this.parsePropertyName;
        }
        this.tempText += token;
        return this.parsePropertyValue;
    }


    private popElement() {
        const element = this.stackTrace.pop();
        if (element) {
            const parent = this.stackTrace.pop();
            if (parent && parent instanceof ElementNode) {
                if (typeof element === 'string') {
                    parent.addTextChild(element);
                } else if (element instanceof ElementNode) {
                    parent.addChild(this.checkNode(element));
                } else {
                    parent.addChild(element);
                }
                this.stackTrace.push(parent);
            }
            else {
                if (typeof element === 'string') {
                    parseTextChild(element).forEach(text => this.childStack.push(text));
                } else if (element instanceof ElementNode) {
                    this.childStack.push(this.checkNode(element));
                } else {
                    this.childStack.push(element);
                }
            }
        }
    }

    checkNode(node: ElementNode): ElementNode | DirectiveNode {
        if (node.attributes) {
            let temp = node.attributes.find(attr => attr.attrName === 'is');
            if (temp) {
                node.attributes.splice(node.attributes.indexOf(temp), 1);
                node.is = temp.attrValue as string;
            }
            temp = node.attributes.find(attr => attr.attrName?.startsWith('*'));
            if (temp) {
                node.attributes.splice(node.attributes.indexOf(temp), 1);
                let directive = new DirectiveNode(temp.attrName, temp.attrValue as string);
                directive.addChild(node);
                return directive;
            }
        }
        return node;
    }

}

export class HTMLParser {

    nodeParser = new NodeParser();

    parse(html: string): AuroraChild[] {
        return this.nodeParser.parse(html);
    }

    toAuroraRootNode(html: string): AuroraNode {
        let stack = this.nodeParser.parse(html);
        if (!stack || stack.length === 0) {
            return new FragmentNode([new TextNode('')]);
        } else if (stack?.length === 1) {
            return stack[0];
        } else {
            return new FragmentNode(stack);
        }
    }

    stringify(stack: AuroraNode[]) {
        let html = '';
        stack?.forEach(node => {
            if (node instanceof TextNode) {
                html += node.textValue;
            } else if (node instanceof LiveText) {
                html += `{{${node.textValue}}}`;
            } else if (node instanceof CommentNode) {
                html += `<!-- ${node.comment} -->`;
            } else if (node instanceof ElementNode) {
                let attrs = '';
                if (node.attributes) {
                    attrs += node.attributes.map(attr => `${attr.attrName}="${attr.attrValue}"`).join(' ') + ' ';
                }
                if (node.twoWayBinding) {
                    attrs += node.twoWayBinding.map(attr => `[(${attr.attrName})]="${attr.sourceValue}"`).join(' ').concat(' ');
                }
                if (node.inputs) {
                    attrs += node.inputs.map(attr => `[${attr.attrName}]="${attr.sourceValue}"`).join(' ').concat(' ');
                }
                if (node.outputs) {
                    attrs += node.outputs.map(attr => `(${attr.eventName})="${attr.sourceHandler}"`).join(' ').concat(' ');
                }
                if (node.templateAttrs) {
                    attrs += node.templateAttrs.map(attr => `${attr.attrName}="${attr.sourceValue}"`).join(' ').concat(' ');
                }
                if (isEmptyElement(node.tagName)) {
                    if (attrs) {
                        html += `<${node.tagName} ${attrs}/>`;
                    } else {
                        html += `<${node.tagName} />`;
                    }
                } else {
                    let children = this.stringify(node.children);
                    if (attrs && children) {
                        html += `<${node.tagName} ${attrs}>${children}</${node.tagName}>`;
                    }
                    else if (attrs) {
                        html += `<${node.tagName} ${attrs}></${node.tagName}>`;
                    } else if (children) {
                        html += `<${node.tagName}>${children}<</${node.tagName}>`;
                    } else {
                        html += `<${node.tagName}></${node.tagName}>`;
                    }
                }
            }
        });
        return html;
    }

}

export const htmlParser = new HTMLParser();
