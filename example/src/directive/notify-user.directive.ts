import {
	Component, Directive, effect, input,
	OnDestroy, StructuralDirective
} from '@ibyar/aurora';


@Component({
	selector: 'notify-component',
	template: `<div class="alert alert-{{notifyType}}" role="alert">{{notifyMessage}}</div>`
})
class NotifyComponent {

	notifyMessage = input<string>();

	notifyType = input<string>();

}


@Directive({
	selector: '*notify-user',
})
export class NotifyUserDirective extends StructuralDirective implements OnDestroy {

	context = this.viewContainerRef.createComponent(NotifyComponent);

	notifyMessage = input<string>(undefined, { alias: 'message' });
	notifyType = input<string>(undefined, { alias: 'type' });

	typeRef = effect(() => this.context.notifyType.set(this.notifyType.get()));
	messageRef = effect(() => this.context.notifyMessage.set(this.notifyMessage.get()));


	onDestroy() {
		this.typeRef.destroy();
		this.messageRef.destroy();
		this.viewContainerRef.clear();
	}

}
