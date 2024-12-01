import {
	Directive, DomParentNode, OnDestroy, OnInit,
	StructuralDirective, PipeTransform, Pipe,
	Component, input,
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
class ShowTimeComponent {
	time = input(0);
	date = input(0);
	hh = input(0);
	mm = input(0);
	ss = input(0);
}


@Directive({
	selector: '*time',
})
export class TimeDirective extends StructuralDirective implements OnInit, OnDestroy {

	private dateSubscription: Subscription;

	updateContext: (context: TimeContext) => void;

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
		this.updateContext = ctx => Object.assign(viewRef.context, ctx);
	}

	private initDefaultView() {
		const model = this.viewContainerRef.createComponent(ShowTimeComponent);
		this.updateContext = ctx => {
			model.date.set(ctx.date);
			model.time.set(ctx.time);
			model.hh.set(ctx.date);
			model.mm.set(ctx.date);
			model.ss.set(ctx.date);
		};
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
		).subscribe(this.updateContext);
	}

	onDestroy() {
		this.dateSubscription.unsubscribe();
		this.viewContainerRef.clear();
	}

}
