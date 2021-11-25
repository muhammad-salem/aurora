import { Component, Input } from '@ibyar/aurora';

@Component({
	selector: 'text-editor',
	template: `<input type="text" [(value)]="text" />`
})
export class Editor {

	@Input()
	text = '';
}


@Component({
	selector: 'app-edit',
	template: `
	<div>{{ model |> json }}</div>
	<text-editor id="editor_0" [class]="row" [(text)]="model.text" ></text-editor>
	<text-editor id="editor_1" [(text)]="model.text" *if="+model.text > 30"></text-editor>
	`
})
export class EditorApp {

	model = { text: 'init 0' };

	row = 'row';


}

