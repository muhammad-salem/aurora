import { JsxComponent } from '@aurorats/types';
import { isEmptyElment } from '@aurorats/element';

export function parseHtmlToJsxComponent(html: string): JsxComponent | undefined {
    return childsToJsxComponent(parseHtml(html));
}

export function childsToJsxComponent(childList: (string | Child)[]): JsxComponent | undefined {
    if (!childList) {
        return undefined;
    }
    if (childList.length === 1) {
        const child = childList[0];
        if (typeof child === 'string') {
            /** a case that should never happen **/
            return { tagName: 'fragment', children: [child] };
        } else {
            let root: JsxComponent = {
                tagName: child.tag as string,
                attributes: child.attrs
            };
            if (child.childs) {
                root.children = [];
                child.childs.forEach(item => {
                    root.children?.push(createComponent(item));
                });
            }
            return root;
        }

    } else if (childList.length > 1) {
        let root: JsxComponent = { tagName: 'fragment', children: [] };
        childList.forEach(item => {
            root.children?.push(createComponent(item));
        });
        return root;
    }
    return undefined;
}

function createComponent(child: string | Child): string | JsxComponent {
    if (typeof child === 'string') {
        // return { tagName: Fragment, children: [child] };
        return child;
    } else {
        let root: JsxComponent = { tagName: child.tag as string, attributes: child.attrs };
        if (child.childs) {
            root.children = child.childs.map(item => createComponent(item));
        }
        return root;
    }
}

export interface Child {
    tag?: string;
    attrs?: { [key: string]: string };
    childs?: (Child | string)[];
}
export function parseHtml(html: string): (string | Child)[] {
    const arr: string[] = html.replace(/</g, '<^').split(/[<|>]/g)
        .filter(str => str?.trim())
        .map(str => str?.trim());
    return analysis(arr);
}

/**
 * tag name start with^, end tag name start with ^/
 * @param arr 
 * @param parent 
 */
function analysis(arr: string[]): (Child | string)[] {
    const childStack: (Child | string)[] = [];
    const stackTrace: (Child | string)[] = [];
    for (let i = 0; i < arr.length; i++) {
        let current = arr[i];
        if ((/^\^!--([\w|\s]+)--/g).test(current)) {
            // comment
            let match = (/^\^!--([\w|\s]+)--/g).exec(current);
            if (match) {
                const comment: Child = {};
                comment.tag = 'comment';
                comment.attrs = { 'comment': match[1] };
                stackTrace.push(comment);
                popElement(stackTrace, childStack);
            }
        }
        // else if ((/^\^\w.*\//g).test(current)) {
        else if ((/^\^(\w|\s).*\//gs).test(current)) {
            // self closing tag // has no childs // should push to parent
            current = current.substring(0, current.length - 1).trim();
            stackTrace.push(defineChild(current));
            popElement(stackTrace, childStack);
        } else if ((/^\^\w/g).test(current)) {
            stackTrace.push(defineChild(current));
            let child = stackTrace[stackTrace.length - 1];
            if (typeof child === 'object') {
                if (isEmptyElment(child.tag as string)) {
                    popElement(stackTrace, childStack);
                }
            }
        } else if ((/^\^\/\w/g).test(current)) {
            popElement(stackTrace, childStack);
        } else {
            stackTrace.push(current);
            popElement(stackTrace, childStack);
        }
    }
    if (stackTrace.length > 0) {
        console.error(stackTrace);
        throw new Error(`error parsing html, had ${stackTrace.length} element, with no closing tag`);
    }
    return childStack;
}

function popElement(stackTrace: (string | Child)[], childStack: (string | Child)[]) {
    const element = stackTrace.pop();
    if (element) {
        const parent = stackTrace.pop();
        if (parent && typeof parent !== 'string') {
            parent.childs = parent.childs || [];
            parent.childs.push(element);
            stackTrace.push(parent);
        }
        else {
            childStack.push(element);
        }
    }
}

function defineChild(htmlStatement: string): Child {
    const currentElement: Child = {};
    const whitespace = htmlStatement.search(/\s/);
    currentElement.tag = htmlStatement.substring(1, whitespace > 0 ? whitespace : undefined);
    if (whitespace > 0) {
        const attrs = htmlStatement.substring(whitespace + 1);
        currentElement.attrs = {};
        let key: string | null = null, value: string | null = null;
        const list = attrs.split(/\s/)
            .filter(str => str.trim())
            .filter(str => str.length > 0);
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if (/(\[?\(?\w*\)?\]?)="(.*)"/g.test(item)) {
                const temp = item.split(/="/);
                key = temp[0];
                value = temp[1].substring(0, temp[1].length - 1);
                currentElement.attrs[key] = value;
                key = value = null;
            } else if (/"/g.test(item)) {
                const temp = item.split(/="/);
                key = temp[0];
                value = temp[1];
                while (i < list.length) {
                    i++;
                    let next = list[i];
                    if (/.*"/g.test(next)) {
                        value += ' ' + next.substring(0, next.length - 1);
                        break;
                    } else {
                        value += ' ' + next;
                    }
                }
                currentElement.attrs[key] = value;
                key = value = null;
            } else {
                key = item;
                value = "true";
                currentElement.attrs[key] = value;
                key = value = null;
            }
        }

    }
    return currentElement;
}
