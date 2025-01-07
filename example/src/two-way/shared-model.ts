import { Component, input } from '@ibyar/aurora';

@Component({
	selector: 'number-editor',
	template: `<input type="number" [(value)]="number" />`
})
export class NumberEditor {

	number = input(0);

}

@Component({
	selector: 'number-viewer',
	template: `{{number|>json}}`,
	extend: 'number-editor',
})
export class NumberViewer extends NumberEditor {

}


@Component({
	selector: 'app-edit',
	template: `
	<div>{{ model |> json }}</div>
	<number-viewer [(number)]="model.text"></number-viewer>
	<number-editor id="editor_0" [(number)]="model.text" ></number-editor>
	<number-editor id="editor_1" [(number)]="model.text" *if="+model.text > 30"></number-editor>
	`,
	imports: [NumberEditor, NumberViewer]
})
export class EditorApp {

	model = { text: '25' };

}
