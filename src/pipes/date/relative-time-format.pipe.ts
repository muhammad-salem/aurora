import { AsyncPipeTransform, ChangeDetectorRef, inject, Pipe } from '@ibyar/core';

type RTFInput = {
	date: Date,
	lang?: string | string[],
	options?: Intl.RelativeTimeFormatOptions,
	unit?: Intl.RelativeTimeFormatUnit,
};


@Pipe({
	name: 'rtf',
	asynchronous: true
})
export class AsyncRelativeTimeFormatPipe implements AsyncPipeTransform<Date, string> {

	private cd = inject(ChangeDetectorRef);

	private input: RTFInput;
	private latestInput: RTFInput;


	private intervalId = setInterval(() => this.update(), 1000);
	private rtf = this.createRTF('en');

	transform(date: Date, unit?: Intl.RelativeTimeFormatUnit, lang?: string | string[], options?: Intl.RelativeTimeFormatOptions,): string {
		this.latestInput = { date, unit, lang, options };
		return this.calcValue();
	}

	private createRTF(lang?: string | string[], options?: Intl.RelativeTimeFormatOptions) {
		return new Intl.RelativeTimeFormat(lang, options);
	}

	private getFormatter() {
		if (this.rtf
			&& this.input?.unit === this.latestInput?.unit
			&& this.input?.lang === this.latestInput?.lang
			&& this.input?.options?.style == this.latestInput?.options?.style
			&& this.input?.options?.numeric === this.latestInput?.options?.numeric
			&& this.input?.options?.localeMatcher === this.latestInput?.options?.localeMatcher) {
			return this.rtf;
		}
		this.input = this.latestInput;
		return this.rtf = this.createRTF(this.input.lang, this.input.options);
	}

	private calcValue(): string {
		const rtf = this.getFormatter();
		const nowSeconds = new Date().getSeconds();
		const seconds = this.input.date.getSeconds() - nowSeconds;
		return rtf.format(seconds, this.input.unit ?? 'seconds');
	}

	private update() {
		this.calcValue();
		this.cd.markForCheck();
	}

	onDestroy(): void {
		clearInterval(this.intervalId);
	}

}
