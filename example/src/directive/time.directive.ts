import {
	Directive, DOMParentNode, htmlParser,
	isModel, OnDestroy, OnInit, ReactiveScope,
	ScopeSubscription, StructuralDirective, Model, PipeTransform, Pipe
} from '@ibyar/aurora';
import { buildExpressionNodes } from '@ibyar/core/html/expression';
import { map, Subscription, timer, timestamp } from 'rxjs';


@Pipe({
	name: 'toDate'
})
export class ToDate implements PipeTransform<number, Date> {
	transform(timestamp: number): Date {
		return new Date(timestamp);
	}
}

type TimeContext = { time: number, date: number, hh: number, mm: number, ss: number };

@Directive({
	selector: '*time',
})
export class TimeDirective extends StructuralDirective implements OnInit, OnDestroy {

	private elements: ChildNode[] = [];
	private fragment: DocumentFragment;
	private scope: ReactiveScope<TimeContext>;
	private dateSubscription: Subscription;
	private scopeSubscription: ScopeSubscription<TimeContext>;
	onInit(): void {
		const wrapperNode = ((this.node as DOMParentNode)?.children?.length > 0) ? this.node : this.getDefaultNode();
		this.fragment = document.createDocumentFragment();
		const stack = this.directiveStack.copyStack();
		this.scope = stack.pushBlockReactiveScopeFor({
			time: 0,
			date: 0,
			hh: 0,
			mm: 0,
			ss: 0,
		});

		this.render.appendChildToParent(this.fragment, wrapperNode, stack, this.parentNode);
		const context = this.scope.getContext();
		if (isModel(context)) {
			this.scopeSubscription = this.scope.subscribe(this.createScopeHandle(context));
		}
		this.fragment.childNodes.forEach(child => this.elements.push(child));
		this.comment.after(this.fragment);
		this.updateTime();
	}

	private updateTime() {
		this.dateSubscription = timer(1000, 1000).pipe(
			timestamp(),
			map(timestamp => timestamp.timestamp),
			map(timestamp => new Date(timestamp))
		).subscribe(date => {
			this.scope.set('hh', date.getHours());
			this.scope.set('mm', date.getMinutes());
			this.scope.set('ss', date.getSeconds());

			this.scope.set('date', date.getDate());
			this.scope.set('time', date.getTime());
		});
	}
	getDefaultNode() {
		const stringLiteralFormat = '`${hh}:${mm}:${ss}`';
		const html = `<div class="alert alert-success" role="alert">
			<ul>
				<li>HH:MM:SS {{hh}}:{{mm}}:{{ss}}</li>
				<li>hh:mm:ss {{${stringLiteralFormat}}} format using regex expression ==> \`$\{hh\}:$\{mm\}:$\{ss\}\`</li>
				<li>Time: {{time |> toDate}}</li>
				<li>Data: {{date}}</li>
			</ul>
		</div>`;
		const defaultTemplateNode = htmlParser.toDomRootNode(html);
		buildExpressionNodes(defaultTemplateNode);
		return defaultTemplateNode;
	}
	private removeOldElements() {
		if (this.elements.length > 0) {
			for (const elm of this.elements) {
				elm.remove();
			}
			this.elements.splice(0);
		}
	}
	private createScopeHandle(context: Model) {
		return (propertyName: keyof TimeContext, oldValue: any, newValue: any) => {
			if (newValue != oldValue) {
				context.emitChangeModel(propertyName, []);
			}
		};
	}

	onDestroy() {
		this.dateSubscription.unsubscribe();
		this.scopeSubscription.unsubscribe();
		this.removeOldElements();
	}
}
