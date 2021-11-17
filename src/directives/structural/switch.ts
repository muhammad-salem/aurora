import { Directive, Input, OnInit, StructuralDirective } from '@ibyar/core';

interface CaseDirectiveValue {
	value: any;
}

@Directive({
	selector: '*case',
})
export class CaseOfSwitchDirective extends StructuralDirective implements CaseDirectiveValue {

	public value: any;

	@Input('case')
	set caseValue(value: any) {
		this.value = value;
		this._updateUI();
	}
	private _updateUI() {
		this.viewContainerRef.clear();
		this.viewContainerRef.createEmbeddedView(this.templateRef, { 'case': this.value });
	}
}

@Directive({
	selector: '*default',
})
export class DefaultCaseOfSwitchDirective extends StructuralDirective implements CaseDirectiveValue {

	public value: any;

	@Input('default')
	set defaultCaseValue(value: any) {
		this.value = value;
		this._updateUI();
	}
	private _updateUI() {
		this.viewContainerRef.clear();
		this.viewContainerRef.createEmbeddedView(this.templateRef, { 'case': this.value });
	}
}

@Directive({
	selector: '*switch',
})
export class SwitchDirective extends StructuralDirective implements OnInit {

	onInit() {
		this.templateRef.astNode;
	}

	private _expression: object | null | undefined;

	@Input('switch')
	set switchValue(expression: object | null | undefined) {
		this._expression = expression;
		console.log('switch', this);
		this._updateUI();
	}

	private _updateUI() {
		this.viewContainerRef.clear();
		this.viewContainerRef.createEmbeddedView(this.templateRef, { 'switch': this._expression });
	}

}
