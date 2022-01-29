import { Directive, EmbeddedViewRef, Input, OnDestroy, StructuralDirective } from '@ibyar/core';
import { diff, PatchArray, PatchOperation, PatchRoot, TrackBy } from '@ibyar/platform';

Reflect.set(window, 'diff', diff);

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

export abstract class AbstractForDirective<T> extends StructuralDirective implements OnDestroy {

	protected _trackBy: TrackBy<T, any>;

	protected _forOf: T[] | null | undefined;
	private _forOfPrevious: T[] | null | undefined;

	protected _updateUI() {
		if (!this._forOf) {
			this.viewContainerRef.clear();
			this.updatePreviousList();
			return;
		}
		if (!this._forOfPrevious) {
			this.insertAll();
			this.updatePreviousList();
			return;
		}
		const patchActions = diff(this._forOfPrevious!, this._forOf, { trackBy: this._trackBy });
		if (patchActions.length === 0) {
			return;
		} else if (PatchRoot === patchActions[0]) {
			this.insertAll();
		} else {
			(patchActions as PatchArray[]).forEach(action => {
				switch (action.op) {
					case PatchOperation.REMOVE:
						this.viewContainerRef.remove(action.currentIndex);
						break;
					case PatchOperation.ADD:
						this.createViewItem(this._forOf![action.nextIndex], action.nextIndex, this._forOf!);
						break;
					case PatchOperation.MOVE:
						this.viewContainerRef.move(this.viewContainerRef.get(action.currentIndex)!, action.nextIndex);
						break;
					default:
					case PatchOperation.REPLACE:
						const context = (this.viewContainerRef.get(action.currentIndex) as EmbeddedViewRef<ForOfContext<T>>).context;
						PatchOperation.REPLACE == action.op && (context.$implicit = this._forOf![action.nextIndex]);
						context.index = action.nextIndex;
						context.count = this._forOf!.length;
						break;
				}
			});
		}
		this.updatePreviousList();
	}

	private insertAll() {
		this._forOf?.map((value, index, array) => {
			return this.createViewItem(value, index, array);
		});
	}

	private createViewItem(value: T, index: number, array: T[]) {
		const context = new ForOfContext<T>(value, array, index, array.length);
		return this.viewContainerRef.createEmbeddedView(this.templateRef, { context, index });
	}

	private updatePreviousList() {
		this._forOfPrevious = this._forOf?.slice();
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
