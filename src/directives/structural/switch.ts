import {
	Directive, Input, Metadata, MetadataContext, OnDestroy,
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

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	private _view: SwitchView = new SwitchView(this.viewContainerRef, this.templateRef);

	declare host: SwitchDirective;

	private _caseValue: any;

	@Input('case')
	set caseValue(value: any) {
		this._caseValue = value;
		this.host._updateView();
	}
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

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	@Input('default')
	defaultCaseValue: any;

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

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	private _defaultViews: SwitchView[] = [];
	private _casesRef: CaseOfSwitchDirective[] = [];
	private _switchValue: any;
	private _lastValue: any;
	private _lastViews: SwitchView[];

	onInit() {
		this.viewContainerRef.createEmbeddedView(this.templateRef);
	}

	@Input('switch')
	set switchValue(value: any) {
		this._switchValue = value;
		this._updateView();
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
