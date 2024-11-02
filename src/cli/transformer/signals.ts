
export type SignalKey =
	| 'input'
	| 'output'
	| 'model'
	| 'formValue'
	| 'view'
	| 'viewChild'
	| 'viewChildren';

export type SignalDetails = Partial<Record<SignalKey, string>>;

export const SIGNAL_NAMES = [
	'input',
	'output',
	'model',
	'formValue',
	'view',
	'viewChild',
	'viewChildren'
];

