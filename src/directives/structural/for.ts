import { Directive, EmbeddedViewRef, Input, OnDestroy, StructuralDirective } from '@ibyar/core';
import { diff, PatchArray, PatchOperation, PatchRoot, TrackBy } from '@ibyar/platform';

export class ForContext<T> {
	constructor(public $implicit: T, public index: number, public count: number) { }

	get first(): boolean {
		return this.index === 0;
	}

	get last(): boolean {
		return this.index === this.count - 1;
	}

	get even(): boolean {
		return this.index % 2 === 0;
	}

	get odd(): boolean {
		return !this.even;
	}

	public update(forContext: ForContext<T>): void {
		Object.assign(this, forContext);
	}
}

export class ForOfContext<T> extends ForContext<T> {
	['of']: T[];
	constructor($implicit: T, forOf: T[], index: number, count: number) {
		super($implicit, index, count);
		this.of = forOf;
	}
}

export class ForInContext<T> extends ForContext<T> {
	['in']: T[];
	constructor($implicit: T, forIn: T[], index: number, count: number) {
		super($implicit, index, count);
		this.in = forIn;
	}
}

const TRACK_BY_IDENTITY: TrackBy<any, any> = (index: number, item: any) => item;

export abstract class AbstractForDirective<T> extends StructuralDirective implements OnDestroy {

	protected _forOf: T[] | null | undefined;
	protected _forTrackBy: TrackBy<T, any> = TRACK_BY_IDENTITY;
	private _$implicitTrackBy: TrackBy<ForOfContext<T>, any> = (index: number, item: ForOfContext<T>) => this._forTrackBy(index, item.$implicit);

	protected _updateUI() {
		if (!this._forOf || this._forOf.length == 0) {
			this.viewContainerRef.clear();
			return;
		}
		const lastContext: ForOfContext<T>[] = new Array(this.viewContainerRef.length);
		for (let i = 0; i < lastContext.length; i++) {
			lastContext[i] = (this.viewContainerRef.get(i) as EmbeddedViewRef<ForOfContext<T>>).context;
		}
		const currentContext = this._forOf.map((item, index, array) => new ForOfContext<T>(item, array, index, array.length));

		if (lastContext.length === 0) {
			currentContext.forEach(context => {
				this.viewContainerRef.createEmbeddedView(this.templateRef, { context });
			});
			return;
		}
		const patchActions = diff(lastContext, currentContext, { trackBy: this._$implicitTrackBy });
		if (patchActions.length === 0) {
			return;
		} else if (PatchRoot === patchActions[0]) {
			currentContext.forEach(context => {
				this.viewContainerRef.createEmbeddedView(this.templateRef, { context });
			});
		} else {
			(patchActions as PatchArray<ForOfContext<T>>[]).forEach(action => {
				switch (action.op) {
					case PatchOperation.REMOVE:
						this.viewContainerRef.remove(action.currentIndex);
						break;
					case PatchOperation.ADD:
						this.viewContainerRef.createEmbeddedView(this.templateRef, { context: action.item, index: action.nextIndex });
						break;
					default:
					case PatchOperation.KEEP:
					case PatchOperation.REPLACE:
					case PatchOperation.MOVE:
						const last = lastContext[action.nextIndex];
						if (last) {
							last.update(action.item);
						} else {
							this.viewContainerRef.createEmbeddedView(this.templateRef, { context: action.item, index: action.nextIndex });
						}
						break;
				}
			});
		}
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}

}

@Directive({
	selector: '*for',
})
export class ForDirective<T> extends AbstractForDirective<T>  {

	@Input('of')
	set forOf(forOf: T[] | null | undefined) {
		this._forOf = forOf;
		this._updateUI();
	}

	@Input('trackBy')
	set trackBy(trackBy: TrackBy<T, any> | null | undefined) {
		this._forTrackBy = typeof trackBy == 'function' ? trackBy : TRACK_BY_IDENTITY;
		this._updateUI();
	}

	get trackBy() {
		return this._forTrackBy;
	}

}

@Directive({
	selector: '*forOf',
})
export class ForOfDirective<T> extends AbstractForDirective<T>  {

	@Input('of')
	set forOf(forOf: T[] | null | undefined) {
		this._forOf = forOf;
		this._updateUI();
	}

	@Input('trackBy')
	set trackBy(trackBy: TrackBy<T, any> | null | undefined) {
		this._forTrackBy = typeof trackBy == 'function' ? trackBy : TRACK_BY_IDENTITY;
		this._updateUI();
	}

	get trackBy() {
		return this._forTrackBy;
	}

}

@Directive({
	selector: '*forAwait',
})
export class ForAwaitDirective<T> extends StructuralDirective implements OnDestroy {

	private _forAwait: AsyncIterable<T> | null | undefined;

	@Input('of')
	set forAwait(forAwait: AsyncIterable<T> | null | undefined) {
		this._forAwait = forAwait;
		this._updateUI().then();
	}

	private async _updateUI() {
		this.viewContainerRef.clear();
		if (!this._forAwait) {
			return;
		}
		const previousContext: ForContext<T>[] = [];
		const asList: T[] = [];
		let index = 0;
		for await (const iterator of this._forAwait) {
			asList.push(iterator);
			const context = new ForOfContext<T>(iterator, asList, index, asList.length);
			const view = this.viewContainerRef.createEmbeddedView(this.templateRef, { context });
			previousContext.forEach(c => c.count = asList.length);
			previousContext.push(view.context);
			index++;
		}
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}

}

@Directive({
	selector: '*forIn',
})
export class ForInDirective<T = { [key: PropertyKey]: any }> extends StructuralDirective implements OnDestroy {

	private _forIn: T | null | undefined;

	@Input('in')
	set forIn(forIn: T | null | undefined) {
		this._forIn = forIn;
		this._updateUI();
	}

	private _updateUI() {
		this.viewContainerRef.clear();
		if (!this._forIn) {
			return;
		}
		const keys = Object.keys(this._forIn) as PropertyKey[];
		keys.forEach((key, index, array) => {
			const context = new ForInContext<PropertyKey>(key, array, index, array.length);
			this.viewContainerRef.createEmbeddedView(this.templateRef, { context });
		});
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}

}
