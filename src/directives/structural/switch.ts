import {
	Directive, input, OnDestroy,
	OnInit, StructuralDirective,
	TemplateRef, ViewContainerRef
} from '@ibyar/core';

export class SwitchView {
	private _created = false;

	constructor(private _viewContainerRef: ViewContainerRef, private _templateRef: TemplateRef) { }

	create(): void {
		this._created = true;
		this._viewContainerRef.createEmbeddedView(this._templateRef);
	}

	destroy(): void {
		this._created = false;
		this._viewContainerRef.clear();
	}

	enforceState(created: boolean) {
		if (created && !this._created) {
			this.create();
		} else if (!created && this._created) {
			this.destroy();
		}
	}
}

@Directive({
	selector: '*case',
})
export class CaseOfSwitchDirective extends StructuralDirective implements OnInit, OnDestroy {

	private _view: SwitchView = new SwitchView(this.viewContainerRef, this.templateRef);

	declare host: SwitchDirective;

	private _caseValue: any;

	case = input.required({
		transform: value => {
			this._caseValue = value;
			this.host._updateView();
			return this._caseValue;
		}
	});

	onInit() {
		this.host._addCase(this);
	}
	getCaseValue() {
		return this._caseValue;
	}
	getView() {
		return this._view;
	}
	create(): void {
		this._view.create();
	}
	onDestroy() {
		this._view.destroy();
	}

}

@Directive({
	selector: '*default'
})
export class DefaultCaseOfSwitchDirective extends StructuralDirective implements OnInit {

	default = input();

	declare host: SwitchDirective;

	onInit() {
		const defaultView = new SwitchView(this.viewContainerRef, this.templateRef);
		this.host._addDefault(defaultView);
	}

}

@Directive({
	selector: '*switch',
})
export class SwitchDirective extends StructuralDirective implements OnInit, OnDestroy {

	private _defaultViews: SwitchView[] = [];
	private _casesRef: CaseOfSwitchDirective[] = [];
	private _switchValue: any;
	private _lastValue: any;
	private _lastViews: SwitchView[];

	switch = input.required({
		transform: value => {
			this._switchValue = value;
			this._updateView();
			return this._switchValue;
		}
	});

	onInit() {
		this.viewContainerRef.createEmbeddedView(this.templateRef);
	}

	onDestroy() {
		this._lastViews?.forEach(view => view.destroy());
		this.viewContainerRef.clear();
	}

	_addCase(_casesRef: CaseOfSwitchDirective) {
		this._casesRef.push(_casesRef);
		this._updateView();
	}

	_addDefault(view: SwitchView) {
		this._defaultViews.push(view);
		this._updateView();
	}
	_updateView() {
		if (this._lastValue !== this._switchValue) {
			this._lastValue = this._switchValue;
			let views = this._casesRef.filter(caseItem => this._switchValue == caseItem.getCaseValue())
				.map(caseItem => caseItem.getView());

			if (!views.length) {
				views = this._defaultViews;
			}

			if (views.length) {
				if (this._lastViews != views) {
					this._lastViews?.forEach(view => view.destroy());
					views.forEach(view => view.create());
				}
				this._lastViews = views;
			}
		}
	}

}
