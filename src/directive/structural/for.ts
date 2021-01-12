import {
    Component, Directive,
    Input, OnInit, StructuralDirective
} from '@ibyar/api';


interface ModelInfo {
    model: any,
    name: string;
}

interface ItemInfo {
    index: number;
    asIndexName: string;
    trackBy: Function;
}

interface KeyValueInfo {
    name: string;
    key: string;
    value: any;
}

@Component({
    selector: 'item-of',
    template: ``
})
class ItemOfComponent {

    @Input()
    modelInfo: ModelInfo;
    @Input() keyValueInfo: KeyValueInfo;

    @Input()
    itemInfo: ItemInfo;
}

@Directive({
    selector: '*for',
})
export class ForDirective<T> extends StructuralDirective<T> implements OnInit {

    lastElement: HTMLElement | Comment;

    onInit(): void {
        console.log(`${this.directive.directiveName}="${this.directive.directiveValue}"`);

        // this.lastElement = this.comment;

        // // hard coded example 'let person of people'

        // let arrayExpression = parseJSExpression('people');

        // let array = arrayExpression.get(this.render.view._model) as any[];
        // for (const item of array) {
        //     const additionalSources: PropertySource[] = [{
        //         property: 'person',
        //         src: item
        //     }];
        //     const element = this.render.createElement(this.directive.children[0] as ElementNode, additionalSources);
        //     this.lastElement.after(element);
        //     this.lastElement = element;
        // }
    }

}
