
export abstract class AbstractControl<T> {
	value: T | null;
	validator?: Validator[] | null;
	asyncValidators?: AsyncValidator[] | null;
	errors?: { [key: string]: any } | null;
}

/**
 * Defines the map of errors returned from failed validation checks.
 */
export type ValidationErrors = {
	/**
	 * Adds a custom error message to the element;
	 * if you set a custom error message, the element is considered to be invalid, 
	 * and the specified error is displayed.
	 * This lets you use JavaScript code to establish a validation failure
	 * other than those offered by the standard HTML validation constraints.
	 * The message is shown to the user when reporting the problem.
	 */
	customValidityMessage?: string;

	/**
	 * any error name that
	 */
	[error: string]: any;
};

export interface Validator {
	validate(control: AbstractControl<any>): ValidationErrors | null;
}

export interface AsyncValidator {
	validate(control: AbstractControl<any>): Promise<ValidationErrors | null>;
}

export type ControlOptions = { validators?: Validator | Validator[], asyncValidators?: AsyncValidator | AsyncValidator[] }


export abstract class AbstractFormGroup<T> extends AbstractControl<T> {
	controls: AbstractControl<any>[];

}

export class FormGroup<T> extends AbstractFormGroup<T> {

}

export class FormBuilder {

	public group<T>(group: Record<string, {}>, options?: ControlOptions): FormGroup<T> {
		const formGroup = new FormGroup<T>();

		return formGroup;
	}

}