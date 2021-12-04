import { Directive, Input, OnDestroy, StructuralDirective } from '@ibyar/core';

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

	protected _forOf: T[] | null | undefined;

	protected _updateUI() {
		this.viewContainerRef.clear();
		if (!this._forOf) {
			return;
		}
		this._forOf.forEach((value, index, array) => {
			const context = new ForOfContext<T>(value, array, index, array.length);
			this.viewContainerRef.createEmbeddedView(this.templateRef, { context });
		});
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
