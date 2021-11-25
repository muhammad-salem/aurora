import {
	Component,
	Directive, Input,
	OnDestroy, OnInit, ScopeSubscription, StructuralDirective
} from '@ibyar/aurora';


type NotifyUserContext = { notifyMessage: string, notifyType: string };

@Component({
	selector: 'notify-component',
	template: `<div class="alert alert-{{notifyType}}" role="alert">{{notifyMessage}}</div>`
})
class NotifyComponent implements NotifyUserContext {

	@Input()
	notifyMessage: string;

	@Input()
	notifyType: string;
}


@Directive({
	selector: '*notify-user',
})
export class NotifyUserDirective extends StructuralDirective implements OnInit, OnDestroy {

	private context: NotifyUserContext = {
		notifyMessage: 'no message',
		notifyType: 'primary'
	};
	private scopeSubscription: ScopeSubscription<NotifyUserContext>;


	@Input('message')
	set notifyMessage(message: string) {
		this.context.notifyMessage = message;
	}

	@Input('type')
	set notifyType(type: string) {
		this.context.notifyType = type;
	}

	private elements: ChildNode[] = [];
	private fragment: DocumentFragment;
	onInit(): void {
		const context = this.viewContainerRef.createComponent(NotifyComponent);
		context.notifyMessage = this.context.notifyMessage;
		context.notifyType = this.context.notifyType;
		this.context = context;
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}

}
