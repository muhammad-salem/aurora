import { JsxAttrComponent } from '@aurorats/types';
import {
    Component, ComponentRender, Directive,
    Input, OnInit, StructuralDirective
} from '@aurorats/api';


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
    selector: '*for, [forOf]',
})
export class ForDirective<T> extends StructuralDirective<T> implements OnInit {

    constructor(
        render: ComponentRender<T>,
        comment: Comment,
        value: string,
        component: JsxAttrComponent) {
        super(render, comment, value, component);
    }

    onInit(): void {
        console.log('ForDirective#onInit()');
    }

}