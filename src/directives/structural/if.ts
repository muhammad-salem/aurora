import { Directive, input, OnDestroy, StructuralDirective, TemplateRef } from '@ibyar/core';


@Directive({
	selector: '*if',
	successors: ['*else'],
})
export class IfThenElseDirective extends StructuralDirective implements OnDestroy {

	_condition: boolean;
	private _thenTemplateRef: TemplateRef = this.templateRef;
	private _elseTemplateRef?: TemplateRef;

	private _lastCondition: boolean | null = null;

	if = input.required<boolean>({
		transform: condition => {
			this._condition = condition;
			this._updateUI();
			return this._condition;
		}
	});

	then = input.required<TemplateRef>({
		transform: template => {
			this._thenTemplateRef = template;
			if (this._condition) {
				// need to force rendering the new template in case of false condition
				this._lastCondition = null;
			}
			this._updateUI();
			return this._thenTemplateRef;
		}
	});

	else = input<TemplateRef>(undefined, {
		transform: template => {
			this._elseTemplateRef = template;
			if (!this._condition) {
				// need to force rendering the new template in case of false condition
				this._lastCondition = null;
			}
			this._updateUI();
			return this._elseTemplateRef;
		}
	});


	protected _updateUI() {
		const elseSuccessor = this.getSuccessor('*else');
		if (this._condition !== this._lastCondition) {
			this._lastCondition = this._condition;
			this.viewContainerRef.clear();
			if (this._condition) {
				this.viewContainerRef.createEmbeddedView(this._thenTemplateRef);
			} else if (this._elseTemplateRef) {
				this.viewContainerRef.createEmbeddedView(this._elseTemplateRef);
			} else if (elseSuccessor) {
				this.viewContainerRef.createEmbeddedView(elseSuccessor);
			}
		}
	}

	onDestroy() {
		this.viewContainerRef.clear();
	}

}
