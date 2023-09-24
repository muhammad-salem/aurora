import { Component, Input } from '@ibyar/aurora';

@Component({
	selector: 'number-editor',
	template: `<input type="number" [(value)]="text" />`
})
export class NumberEditor {

	@Input()
	text = 0;
}

@Component({
	selector: 'number-viewer',
	template: `{{text}}`,
	extend: 'number-editor',
})
export class NumberViewer extends NumberEditor {

}


@Component({
	selector: 'app-edit',
	template: `
	<div>{{ model |> json }}</div>
	<number-viewer [(text)]="model.text"></number-viewer>
	<number-editor id="editor_0" [(text)]="model.text" ></number-editor>
	<number-editor id="editor_1" [(text)]="model.text" *if="+model.text > 30"></number-editor>
	`,
	imports: [NumberEditor, NumberViewer]
})
export class EditorApp {

	model = { text: '25' };

}
