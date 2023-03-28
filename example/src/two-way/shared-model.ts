import { Component, Input, Metadata, MetadataContext } from '@ibyar/aurora';

@Component({
	selector: 'text-editor',
	template: `<input type="number" [(value)]="text" />`
})
export class Editor {

	@Input()
	text = '';
}


@Component({
	selector: 'app-edit',
	template: `
	<div>{{ model |> json }}</div>
	<text-editor id="editor_0" [(text)]="model.text" ></text-editor>
	<text-editor id="editor_1" [(text)]="model.text" *if="+model.text > 30"></text-editor>
	`,
	imports: [Editor]
})
export class EditorApp {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	model = { text: '25' };

}

