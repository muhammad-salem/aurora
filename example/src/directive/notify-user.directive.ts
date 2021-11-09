import {
	Directive, DOMElementNode,
	htmlParser, Input,
	isModel, Model,
	OnDestroy, OnInit, ReactiveScope,
	ScopeSubscription, StructuralDirective
} from '@ibyar/aurora';

import { buildExpressionNodes } from '@ibyar/core/html/expression';

type NotifyUserContext = { notifyMessage: string, notifyType: string };

@Directive({
	selector: '*notify-user',
})
export class NotifyUserDirective extends StructuralDirective implements OnInit, OnDestroy {

	private scope: ReactiveScope<NotifyUserContext> = ReactiveScope.blockScopeFor({
		notifyMessage: 'no message',
		notifyType: 'primary'
	});
	private scopeSubscription: ScopeSubscription<NotifyUserContext>;


	@Input()
	set notifyMessage(message: string) {
		this.scope.set('notifyMessage', message);
	}

	@Input()
	set notifyType(type: string) {
		this.scope.set('notifyType', type);
	}

	private elements: ChildNode[] = [];
	private fragment: DocumentFragment;
	onInit(): void {
		const html = `<div class="alert alert-{{notifyType}}" role="alert">{{notifyMessage}}</div>`;
		const wrapperNode = htmlParser.toDomRootNode(html) as DOMElementNode;
		buildExpressionNodes(wrapperNode);

		this.fragment = document.createDocumentFragment();
		const stack = this.directiveStack.copyStack();
		stack.pushScope(this.scope);
		this.render.appendChildToParent(this.fragment, wrapperNode, stack, this.parentNode);
		const context = this.scope.getContext();
		if (isModel(context)) {
			this.scopeSubscription = this.scope.subscribe(this.createScopeHandle(context));
		}
		this.fragment.childNodes.forEach(child => this.elements.push(child));
		this.comment.after(this.fragment);
	}

	private createScopeHandle(context: Model) {
		return (propertyName: keyof NotifyUserContext, oldValue: any, newValue: any) => {
			if (newValue != oldValue) {
				context.emitChangeModel(propertyName, []);
			}
		};
	}

	onDestroy() {
		this.scopeSubscription.unsubscribe();
	}

}
