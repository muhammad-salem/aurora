import {
	Directive, EmbeddedViewRef, input,
	OnDestroy, StructuralDirective, ViewRef
} from '@ibyar/core';
import {
	diff, PatchArray, PatchOperation,
	PatchRoot, TrackBy
} from '@ibyar/platform';

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
		const emptySuccessor = this.getSuccessor('*empty');
		if (!this._forOf || this._forOf.length == 0) {
			this.viewContainerRef.clear();
			if (emptySuccessor) {
				this.viewContainerRef.createEmbeddedView(emptySuccessor);
			}
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
			const views = currentContext.map(context =>
				this.viewContainerRef.createEmbeddedView(this.templateRef, { context, insert: false })
			);
			this.viewContainerRef.updateViews(views);
		} else {
			const views = (patchActions as PatchArray<ForOfContext<T>>[])
				.map(patch => ({
					index: patch.nextIndex,
					view: this._getView(patch, lastContext),
				}))
				.filter(item => !!item.view)
				.sort((a, b) => a.index - b.index)
				.map(i => i.view) as ViewRef[];
			views.forEach(view => view.detectChanges());
			this.viewContainerRef.updateViews(views);
		}
	}
	private _getView(patch: PatchArray<ForOfContext<T>>, lastContext: ForOfContext<T>[]) {
		if (PatchOperation.REMOVE === patch.op) {
			return void 0;
		}
		if (PatchOperation.ADD === patch.op) {
			return this.viewContainerRef.createEmbeddedView(this.templateRef, { context: patch.item, index: patch.nextIndex });
		}
		if (PatchOperation.KEEP === patch.op) {
			lastContext[patch.nextIndex].update(patch.item);
			return this.viewContainerRef.get(patch.nextIndex);
		}
		lastContext[patch.currentIndex].update(patch.item);
		return this.viewContainerRef.get(patch.currentIndex);
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}

}

@Directive({
	selector: '*for',
	successors: ['*empty'],
})
export class ForDirective<T> extends AbstractForDirective<T> {

	of = input.required<T[] | null | undefined>({
		transform: forOf => {
			this._forOf = forOf;
			this._updateUI();
			return this._forOf;
		}
	});

	trackBy = input<TrackBy<T, any> | null | undefined, TrackBy<T, any>>(TRACK_BY_IDENTITY, {
		transform: trackBy => {
			this._forTrackBy = typeof trackBy == 'function' ? trackBy : TRACK_BY_IDENTITY;
			this._updateUI();
			return this._forTrackBy;
		},
	});

}

@Directive({
	selector: '*forOf',
	successors: ['*empty'],
})
export class ForOfDirective<T> extends AbstractForDirective<T> {

	of = input.required<T[] | null | undefined>({
		transform: forOf => {
			this._forOf = forOf;
			this._updateUI();
			return this._forOf;
		}
	});

	trackBy = input<TrackBy<T, any> | null | undefined, TrackBy<T, any>>(TRACK_BY_IDENTITY, {
		transform: trackBy => {
			this._forTrackBy = typeof trackBy == 'function' ? trackBy : TRACK_BY_IDENTITY;
			this._updateUI();
			return this._forTrackBy;
		},
	});

}

@Directive({
	selector: '*forAwait',
	successors: ['*empty'],
})
export class ForAwaitDirective<T> extends StructuralDirective implements OnDestroy {

	private _forAwait: AsyncIterable<T> | null | undefined;

	of = input.required<AsyncIterable<T> | null | undefined>({
		transform: forAwait => {
			this._forAwait = forAwait;
			this._updateUI();
			return this._forAwait;
		}
	});

	private async _updateUI() {
		this.viewContainerRef.clear();
		const emptySuccessor = this.getSuccessor('*empty');
		if (!this._forAwait) {
			if (emptySuccessor) {
				this.viewContainerRef.createEmbeddedView(emptySuccessor);
			}
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
	successors: ['*empty'],
})
export class ForInDirective<T = { [key: PropertyKey]: any }> extends StructuralDirective implements OnDestroy {

	private _forIn: T | null | undefined;

	in = input.required<T | null | undefined>({
		transform: forIn => {
			this._forIn = forIn;
			this._updateUI();
			return this._forIn;
		}
	});

	private _updateUI() {
		this.viewContainerRef.clear();
		const emptySuccessor = this.getSuccessor('*empty');
		if (!this._forIn) {
			if (emptySuccessor) {
				this.viewContainerRef.createEmbeddedView(emptySuccessor);
			}
			return;
		}
		const keys = Object.keys(this._forIn) as PropertyKey[];
		keys.forEach((key, index, array) => {
			const context = new ForInContext<PropertyKey>(key, array, index, array.length);
			this.viewContainerRef.createEmbeddedView(this.templateRef, { context });
		});
		if (keys.length == 0 && emptySuccessor) {
			this.viewContainerRef.createEmbeddedView(emptySuccessor);
		}
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}

}
