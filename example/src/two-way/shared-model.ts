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
	<text-editor id="editor_0" [(text)]="model.text" ></text-editor>
	<text-editor id="editor_1" [(text)]="model.text" ></text-editor>
	`
})
export class EditorApp {

	model = { text: 'init 0' };
}

