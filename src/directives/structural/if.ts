import { Directive, Input, Metadata, MetadataContext, OnDestroy, StructuralDirective, TemplateRef } from '@ibyar/core';


@Directive({
	selector: '*if',
})
export class IfThenElseDirective extends StructuralDirective implements OnDestroy {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	_condition: boolean;
	private _thenTemplateRef: TemplateRef = this.templateRef;
	private _elseTemplateRef?: TemplateRef;

	private _lastCondition: boolean | null = null;


	@Input('if')
	set ifCondition(condition: boolean) {
		this._condition = condition;
		this._updateUI();
	}

	get ifCondition() {
		return this._condition;
	}

	@Input('then')
	set thenTemplateRef(template: TemplateRef) {
		this._thenTemplateRef = template;
		if (this._condition) {
			// need to force rendering the new template in case of false condition
			this._lastCondition = null;
		}
		this._updateUI();
	}

	get thenTemplateRef() {
		return this._thenTemplateRef;
	}

	@Input('else')
	set elseTemplateRef(template: TemplateRef) {
		this._elseTemplateRef = template;
		if (!this._condition) {
			// need to force rendering the new template in case of false condition
			this._lastCondition = null;
		}
		this._updateUI();
	}

	private _updateUI() {
		if (this._condition !== this._lastCondition) {
			this._lastCondition = this._condition;
			this.viewContainerRef.clear();
			if (this._condition) {
				this.viewContainerRef.createEmbeddedView(this._thenTemplateRef);
			} else if (this._elseTemplateRef) {
				this.viewContainerRef.createEmbeddedView(this._elseTemplateRef);
			}
		}
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}

}
