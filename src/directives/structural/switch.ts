import {
	Directive, Input, OnDestroy,
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

	host: SwitchDirective;

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

	@Input('default')
	defaultCaseValue: any;

	host: SwitchDirective;

	onInit() {
		const defaultView = new SwitchView(this.viewContainerRef, this.templateRef);
		this.host._setDefault(defaultView);
	}

}

@Directive({
	selector: '*switch',
})
export class SwitchDirective extends StructuralDirective implements OnInit, OnDestroy {

	private _defaultView: SwitchView;
	private _casesRef: CaseOfSwitchDirective[] = [];
	private _switchValue: any;
	private _lastValue: any;
	private _lastView: SwitchView;

	onInit() {
		this.viewContainerRef.createEmbeddedView(this.templateRef);
	}

	@Input('switch')
	set switchValue(value: any) {
		this._switchValue = value;
		this._updateView();
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}

	_addCase(_casesRef: CaseOfSwitchDirective) {
		this._casesRef.push(_casesRef);
		this._updateView();
	}

	_setDefault(view: SwitchView) {
		this._defaultView = view;
		this._updateView();
	}
	_updateView() {
		if (this._lastValue !== this._switchValue) {
			this._lastValue = this._switchValue;

			let view: SwitchView | undefined;
			for (const caseRef of this._casesRef) {
				if (this._switchValue == caseRef.getCaseValue()) {
					view = caseRef.getView();
					break;
				}
			}
			if (!view) {
				view = this._defaultView;
			}

			if (view) {
				if (this._lastView != view) {
					this._lastView?.destroy();
				}
				view.create();
				this._lastView = view;
			}
		}
	}

}
