export enum LanguageMode {
	Sloppy,
	Strict,
};

export function isSloppy(mode: LanguageMode) {
	return LanguageMode.Sloppy === mode;
}

export function isStrict(mode: LanguageMode) {
	return LanguageMode.Strict === mode;
}

export function getLanguageMode(isModule: boolean) {
	return !!isModule ? LanguageMode.Strict : LanguageMode.Sloppy;
}