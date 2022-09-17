import type { AbstractControl } from './form-control.js';


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


function isEmptyInputValue(value: any): value is null | undefined | '' | [] {
	return value == null ||
		((typeof value === 'string' || Array.isArray(value)) && value.length === 0);
}

function hasValidLength(value: any) {
	return value != null && typeof value.length === 'number';
}

const EMAIL_REGEXP = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export class RequiredValidator implements Validator {
	validate(control: AbstractControl<any>): ValidationErrors | null {
		return isEmptyInputValue(control.value) ? { required: true } : null;
	}
}

export class RequiredTrueValidator implements Validator {
	validate(control: AbstractControl<boolean>): ValidationErrors | null {
		return control.value === true ? null : { required: true };
	}
}

export class MinimumValidator implements Validator {
	constructor(private min: number) { }
	validate(control: AbstractControl<string>): ValidationErrors | null {
		if (isEmptyInputValue(control.value) || isEmptyInputValue(this.min)) {
			return null;
		}
		const value = parseFloat(control.value);
		return !isNaN(value) && value < this.min ? { min: { min: this.min, actual: control.value } } : null;
	}
}

export class MaximumValidator implements Validator {
	constructor(private max: number) { }
	validate(control: AbstractControl<string>): ValidationErrors | null {
		if (isEmptyInputValue(control.value) || isEmptyInputValue(this.max)) {
			return null;
		}
		const value = parseFloat(control.value);
		return !isNaN(value) && value > this.max ? { max: { max: this.max, actual: control.value } } : null;
	}
}


export class EmailValidator implements Validator {
	validate(control: AbstractControl<string>): ValidationErrors | null {
		if (isEmptyInputValue(control.value)) {
			return null;
		}
		return EMAIL_REGEXP.test(control.value) ? null : { 'email': true };
	}
}

export class MinLengthValidator implements Validator {
	constructor(private minLength: number) { }
	validate(control: AbstractControl<string>): ValidationErrors | null {
		if (isEmptyInputValue(control.value) || !hasValidLength(control.value)) {
			return null;
		}
		return control.value.length < this.minLength
			? { minlength: { requiredLength: this.minLength, actualLength: control.value.length } }
			: null;
	}
}

export class MaxLengthValidator implements Validator {
	constructor(private maxLength: number) { }
	validate(control: AbstractControl<string>): ValidationErrors | null {
		return hasValidLength(control.value) && (control.value?.length ?? 0) > this.maxLength
			? { maxlength: { requiredLength: this.maxLength, actualLength: control.value?.length ?? 0 } }
			: null;
	}
}

export class PatternValidator implements Validator {

	private regex: RegExp;
	private regexStr: string;
	constructor(pattern: RegExp | string) {
		if (typeof pattern === 'string') {
			this.regexStr = '';
			if (pattern.charAt(0) !== '^')
				this.regexStr += '^';
			this.regexStr += pattern;
			if (pattern.charAt(pattern.length - 1) !== '$')
				this.regexStr += '$';
			this.regex = new RegExp(this.regexStr);
		}
		else {
			this.regexStr = pattern.toString();
			this.regex = pattern;
		}
	}
	validate(control: AbstractControl<string>): ValidationErrors | null {
		if (isEmptyInputValue(control.value)) {
			return null;
		}
		const value = control.value;
		return this.regex.test(value)
			? null
			: { pattern: { requiredPattern: this.regexStr, actualValue: value } };
	}
}

export class Validators {

	static required() {
		return new RequiredValidator();
	}

	static requiredTrue() {
		return new RequiredValidator();
	}

	static min(min: number) {
		return new MinimumValidator(min);
	}

	static max(max: number) {
		return new MaximumValidator(max);
	}

	static email() {
		return new EmailValidator();
	}

	static minLength(minLength: number) {
		return new MinLengthValidator(minLength);
	}

	static maxLength(maxLength: number) {
		return new MaxLengthValidator(maxLength);
	}

	static pattern(pattern: string | RegExp) {
		if (!pattern) {
			return null;
		}
		return new PatternValidator(pattern);
	}
}

