import { AsyncValidator, Validator } from '../forms/validators.js';

export type ControlOptions = { validators?: Validator | Validator[], asyncValidators?: AsyncValidator | AsyncValidator[] }

export type ControlValue<T = any> = { value?: T | null, disabled: boolean };

export function isControlValue<T>(ref: any): ref is ControlValue<T> {
	return ref.value || ref.disabled;
}
