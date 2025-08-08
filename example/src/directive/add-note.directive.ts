import { Component, Directive, input, OnDestroy, OnInit, StructuralDirective } from '@ibyar/aurora';


@Component({
	selector: 'note-component',
	template: `<div class="alert alert-success" role="alert">structural directive name: '{{directiveName}}'</div>`
})
export class NoteComponent {
	directiveName = input<string>();
}

@Directive({
	selector: '*add-note',
})
export class AddNoteDirective extends StructuralDirective implements OnInit, OnDestroy {

	onInit(): void {
		this.viewContainerRef.createEmbeddedView(this.templateRef);
		const node = this.viewContainerRef.createComponent(NoteComponent).component;
		node.directiveName.set('*add-note');
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}

}
