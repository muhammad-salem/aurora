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
	customValidityMessage?: string | null;

	/**
	 * any error name that
	 */
	[error: string]: any;
};

export interface Validator {
	validate(control: AbstractControl<any>): ValidationErrors | null;
	updateCustomValidityMessage(message?: string | null): void;
}

export interface AsyncValidator {
	validate(control: AbstractControl<any>): Promise<ValidationErrors | null>;
	updateCustomValidityMessage(message?: string | null): void;
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
	constructor(private message?: string | null) { }
	validate(control: AbstractControl<any>): ValidationErrors | null {
		return isEmptyInputValue(control.value)
			? {
				required: true,
				customValidityMessage: this.message
			}
			: null;
	}
	updateCustomValidityMessage(message?: string | null): void {
		this.message = message;
	}
}

export class RequiredTrueValidator implements Validator {
	constructor(private message?: string | null) { }
	validate(control: AbstractControl<boolean>): ValidationErrors | null {
		return control.value === true
			? null
			: {
				required: true,
				customValidityMessage: this.message
			};
	}
	updateCustomValidityMessage(message?: string | null): void {
		this.message = message;
	}
}

export class MinimumValidator implements Validator {
	constructor(private min: number, private message?: string | null) { }
	validate(control: AbstractControl<string>): ValidationErrors | null {
		if (isEmptyInputValue(control.value) || isEmptyInputValue(this.min)) {
			return null;
		}
		const value = parseFloat(control.value);
		return !isNaN(value) && value < this.min
			? {
				min: { min: this.min, actual: control.value },
				customValidityMessage: this.message,
			}
			: null;
	}
	updateCustomValidityMessage(message?: string | null): void {
		this.message = message;
	}
}

export class MaximumValidator implements Validator {
	constructor(private max: number, private message?: string | null) { }
	validate(control: AbstractControl<string>): ValidationErrors | null {
		if (isEmptyInputValue(control.value) || isEmptyInputValue(this.max)) {
			return null;
		}
		const value = parseFloat(control.value);
		return !isNaN(value) && value > this.max
			? {
				max: { max: this.max, actual: control.value },
				customValidityMessage: this.message,
			}
			: null;
	}
	updateCustomValidityMessage(message?: string | null): void {
		this.message = message;
	}
}


export class EmailValidator implements Validator {
	constructor(private message?: string | null) { }
	validate(control: AbstractControl<string>): ValidationErrors | null {
		if (isEmptyInputValue(control.value)) {
			return null;
		}
		return EMAIL_REGEXP.test(control.value)
			? null
			: {
				email: true,
				customValidityMessage: this.message
			};
	}
	updateCustomValidityMessage(message?: string | null): void {
		this.message = message;
	}
}

export class MinLengthValidator implements Validator {
	constructor(private minLength: number, private message?: string | null) { }
	validate(control: AbstractControl<string>): ValidationErrors | null {
		if (isEmptyInputValue(control.value) || !hasValidLength(control.value)) {
			return null;
		}
		return control.value.length < this.minLength
			? {
				minlength: { requiredLength: this.minLength, actualLength: control.value.length },
				customValidityMessage: this.message,
			}
			: null;
	}
	updateCustomValidityMessage(message?: string | null): void {
		this.message = message;
	}
}

export class MaxLengthValidator implements Validator {
	constructor(private maxLength: number, private message?: string | null) { }
	validate(control: AbstractControl<string>): ValidationErrors | null {
		return hasValidLength(control.value) && (control.value?.length ?? 0) > this.maxLength
			? {
				maxlength: { requiredLength: this.maxLength, actualLength: control.value?.length ?? 0 },
				customValidityMessage: this.message,
			}
			: null;
	}
	updateCustomValidityMessage(message?: string | null): void {
		this.maxLength = this.maxLength;
	}
}

export class PatternValidator implements Validator {

	private regex: RegExp;
	private regexStr: string;
	constructor(pattern: RegExp | string, private message?: string | null) {
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
			: {
				pattern: { requiredPattern: this.regexStr, actualValue: value },
				customValidityMessage: this.message,
			};
	}
	updateCustomValidityMessage(message?: string | null): void {
		this.message = message;
	}
}

/***
 * pre created validators with out `customValidityMessage`
 */
const PRE_VALIDATORS = {
	required: new RequiredValidator(),
	requiredTrue: new RequiredTrueValidator(),
	email: new EmailValidator(),
};

export class Validators {

	static required(customValidityMessage?: string): RequiredValidator {
		if (customValidityMessage) {
			return new RequiredValidator(customValidityMessage);
		}
		return PRE_VALIDATORS.required;
	}

	static requiredTrue(customValidityMessage?: string): RequiredTrueValidator {
		if (customValidityMessage) {
			return new RequiredTrueValidator(customValidityMessage);
		}
		return PRE_VALIDATORS.requiredTrue;
	}

	static min(min: number, customValidityMessage?: string): MinimumValidator {
		return new MinimumValidator(min, customValidityMessage);
	}

	static max(max: number, customValidityMessage?: string): MaximumValidator {
		return new MaximumValidator(max, customValidityMessage);
	}

	static email(customValidityMessage?: string) {
		if (customValidityMessage) {

		}
		return PRE_VALIDATORS.email;
	}

	static minLength(minLength: number, customValidityMessage?: string): MinLengthValidator {
		return new MinLengthValidator(minLength, customValidityMessage);
	}

	static maxLength(maxLength: number, customValidityMessage?: string): MaxLengthValidator {
		return new MaxLengthValidator(maxLength, customValidityMessage);
	}

	static pattern(pattern: string | RegExp, customValidityMessage?: string): PatternValidator | null {
		if (!pattern) {
			return null;
		}
		return new PatternValidator(pattern, customValidityMessage);
	}
}
