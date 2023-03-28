import { Component, Directive, Input, Metadata, MetadataContext, OnDestroy, OnInit, StructuralDirective } from '@ibyar/aurora';


@Component({
	selector: 'note-component',
	template: `<div class="alert alert-success" role="alert">structural directive name: '{{directiveName}}'</div>`
})
class NoteComponent {

	@Metadata
	static [Symbol.metadata]: MetadataContext;


	@Input()
	directiveName: string;
}

@Directive({
	selector: '*add-note',
})
export class AddNoteDirective extends StructuralDirective implements OnInit, OnDestroy {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	onInit(): void {
		this.viewContainerRef.createEmbeddedView(this.templateRef);
		const node = this.viewContainerRef.createComponent(NoteComponent);
		node.directiveName = '*add-note';
	}


	onDestroy() {
		this.viewContainerRef.clear();
	}
}