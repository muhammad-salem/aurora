import { FormGroup } from '../forms/form-group.js';
import { AsyncValidator, Validator } from '../forms/validators.js';

export type ControlOptions = { validators?: Validator | Validator[], asyncValidators?: AsyncValidator | AsyncValidator[] }


export class FormBuilder {

	public group<T>(group: Record<string, {}>, options?: ControlOptions): FormGroup<T> {
		const formGroup = new FormGroup<T>();

		return formGroup;
	}

}