export type Id = string;

export type AriaAutocomplete = 'none' | 'inline' | 'list' | 'booth';

export type AriaChecked = true | false | undefined | 'mixed';

export type AriaDisabled = boolean;
export type AriaErrorMessage = Id;

export type AriaExpanded = boolean | undefined;

export type AriaHasPopup = boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';

export type AriaHidden = boolean | undefined;

export type AriaInvalid = 'grammar' | 'spelling' | boolean;

export type AriaLabel = string;

export type AriaLevel = number;

export type AriaModal = boolean;

export type AriaMultiline = boolean;

export type AriaMultiSelectable = boolean;

export type AriaOrientation = 'horizontal' | 'vertical';

export type AriaPlaceholder = string;

export type AriaPressed = boolean | 'mixed' | undefined;

export type AriaReadonly = boolean;

export type AriaRequired = boolean;

export type AriaSelected = boolean | undefined;

export type AriaSort = 'ascending' | 'descending' | 'none' | 'other';

export type AriaValueMax = number;

export type AriaValueMin = number;

export type AriaValueNow = number;

export type AriaValueText = string;


export interface WidgetModel {
	ariaAutocomplete: AriaAutocomplete,
	ariaChecked: AriaChecked,
	ariaDisabled: AriaDisabled,
	ariaErrorMessage: AriaErrorMessage,
	ariaExpanded: AriaExpanded,
	ariaHasPopup: AriaHasPopup,
	ariaHidden: AriaHidden,
	ariaInvalid: AriaInvalid,
	ariaLabel: AriaLabel,
	ariaLevel: AriaLevel,
	ariaModal: AriaModal,

	ariaMultiline: AriaMultiline,
	ariaMultiSelectable: AriaMultiSelectable,
	ariaOrientation: AriaOrientation,
	ariaPlaceholder: AriaPlaceholder,
	ariaPressed: AriaPressed,
	ariaReadonly: AriaReadonly,
	ariaRequired: AriaRequired,
	ariaSelected: AriaSelected,
	ariaSort: AriaSort,
	ariaValueMax: AriaValueMax,
	ariaValueMin: AriaValueMin,
	ariaValueNow: AriaValueNow,
	ariaValueText: AriaValueText,
}

export const WidgetAttributes = [
	'aria-autocomplete',
	'aria-checked',
	'aria-disabled',
	'aria-errormessage',
	'aria-expanded',
	'aria-haspopup',
	'aria-hidden',
	'aria-invalid',
	'aria-label',
	'aria-level',
	'aria-modal',
	'aria-multiline',
	'aria-multiselectable',
	'aria-orientation',
	'aria-placeholder',
	'aria-pressed',
	'aria-readonly',
	'aria-required',
	'aria-selected',
	'aria-sort',
	'aria-valuemax',
	'aria-valuemin',
	'aria-valuenow',
	'aria-valuetext',
];
