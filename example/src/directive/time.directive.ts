import { Directive, DOMParentNode, htmlParser, OnDestroy, OnInit, Scope, StructuralDirective } from '@ibyar/aurora';
import { buildExpressionNodes } from '@ibyar/core/html/expression';
import { map, Subscription, timer, timestamp } from 'rxjs';

type TimeContext = { time: string, date: string, hh: string, mm: string, ss: string };

@Directive({
	selector: '*time',
})
export class TimeDirective extends StructuralDirective implements OnInit, OnDestroy {

	private elements: ChildNode[] = [];
	private fragment: DocumentFragment;
	private scope: Scope<TimeContext>;
	private dateSubscription: Subscription;
	onInit(): void {
		const wrapperNode = ((this.node as DOMParentNode)?.children?.length > 0) ? this.node : this.getDefaultNode();
		this.fragment = document.createDocumentFragment();
		const stack = this.directiveStack.copyStack();
		this.scope = stack.pushBlockReactiveScopeFor({
			time: 'time',
			date: 'date',
			hh: 'hh',
			mm: 'mm',
			ss: 'ss',
		});
		this.render.appendChildToParent(this.fragment, wrapperNode, stack, this.parentNode);
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
				<li>hh:mm:ss{{${stringLiteralFormat}}}</li>
				<li>Time: {{tme}}</li>
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
	onDestroy() {
		this.dateSubscription.unsubscribe();
		this.removeOldElements();
	}
}
