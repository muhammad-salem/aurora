import {
	Directive, DomParentNode, OnDestroy, OnInit,
	StructuralDirective, PipeTransform, Pipe,
	Component, Input,
} from '@ibyar/aurora';
import { map, Subscription, timer, timestamp } from 'rxjs';


@Pipe({ name: 'toDate' })
export class ToDate implements PipeTransform<number, Date> {
	transform(timestamp: number): Date {
		return new Date(timestamp);
	}
}

type TimeContext = { time: number, date: number, hh: number, mm: number, ss: number };

const stringLiteralFormat = '`${hh}:${mm}:${ss}`';
@Component({
	selector: 'show-time',
	template: `<div class="alert alert-success" role="alert">
			<ul>
				<li>HH:MM:SS {{hh}}:{{mm}}:{{ss}}</li>
				<li>hh:mm:ss {{${stringLiteralFormat}}} format using string literal ==> \`$\{hh\}:$\{mm\}:$\{ss\}\`</li>
				<li>Time: {{time |> toDate}}</li>
				<li>Data: {{date}}</li>
			</ul>
		</div>`
})
class ShowTimeComponent implements TimeContext {

	@Input() time: number = 0;
	@Input() date: number = 0;
	@Input() hh: number = 0;
	@Input() mm: number = 0;
	@Input() ss: number = 0;
}


@Directive({
	selector: '*time',
})
export class TimeDirective extends StructuralDirective implements OnInit, OnDestroy {

	private dateSubscription: Subscription;
	private context: TimeContext;
	onInit(): void {
		if ((this.templateRef.astNode as DomParentNode)?.children?.length) {
			this.initUserView();
		} else {
			this.initDefaultView();
		}
		this.startTimer();
	}

	private initUserView() {
		const initValue = {
			time: 0,
			date: 0,
			hh: 0,
			mm: 0,
			ss: 0,
		};
		const viewRef = this.viewContainerRef.createEmbeddedView(this.templateRef, { context: initValue });
		this.context = viewRef.context;
	}

	private initDefaultView() {
		this.context = this.viewContainerRef.createComponent(ShowTimeComponent);
	}

	private startTimer() {
		this.dateSubscription = timer(1000, 1000).pipe(
			timestamp(),
			map(timestamp => timestamp.timestamp),
			map(timestamp => new Date(timestamp)),
			map(date => ({
				time: date.getTime(),
				date: date.getDate(),
				hh: date.getHours(),
				mm: date.getMinutes(),
				ss: date.getSeconds(),
			})),
		).subscribe(context => Object.assign(this.context, context));
	}

	onDestroy() {
		this.dateSubscription.unsubscribe();
		this.viewContainerRef.clear();
	}
}
