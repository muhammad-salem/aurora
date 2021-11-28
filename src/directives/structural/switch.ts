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
export class CaseOfSwitchDirective extends StructuralDirective implements OnDestroy {

	private _view: SwitchView = new SwitchView(this.viewContainerRef, this.templateRef);

	host: SwitchDirective;

	@Input('case')
	set caseValue(value: any) {
		this._view.enforceState(this.host._matchCase(value));
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
		this.host._addDefault(defaultView);
	}

}

@Directive({
	selector: '*switch',
})
export class SwitchDirective extends StructuralDirective implements OnInit, OnDestroy {

	private _defaultViews!: SwitchView[];
	private _defaultUsed = false;
	private _caseCount = 0;
	private _lastCaseCheckIndex = 0;
	private _lastCasesMatched = false;
	private _switchValue: any;

	onInit() {
		this.viewContainerRef.createEmbeddedView(this.templateRef);
	}

	@Input('switch')
	set switchValue(value: any) {
		this._switchValue = value;
		if (this._caseCount === 0) {
			this._updateDefaultCases(true);
		}
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}

	/** @internal */
	_addCase(): number {
		return this._caseCount++;
	}

	/** @internal */
	_addDefault(view: SwitchView) {
		if (!this._defaultViews) {
			this._defaultViews = [];
		}
		this._defaultViews.push(view);
	}
	/** @internal */
	_matchCase(value: any): boolean {
		const matched = value == this._switchValue;
		this._lastCasesMatched ||= matched;
		this._lastCaseCheckIndex++;
		if (this._lastCaseCheckIndex === this._caseCount) {
			this._updateDefaultCases(!this._lastCasesMatched);
			this._lastCaseCheckIndex = 0;
			this._lastCasesMatched = false;
		}
		return matched;
	}

	private _updateDefaultCases(useDefault: boolean) {
		if (this._defaultViews && useDefault !== this._defaultUsed) {
			this._defaultUsed = useDefault;
			for (let i = 0; i < this._defaultViews.length; i++) {
				const defaultView = this._defaultViews[i];
				defaultView.enforceState(useDefault);
			}
		}
	}

}
