import { provide } from './inject.js';
import { InjectionToken } from './provider.js';

export const LOCALE_ID = new InjectionToken<string>('LOCALE_ID');

export interface DatePipeConfig {
	dateFormat?: string;
	timezone?: string;
}
export const DATE_PIPE_DEFAULT_OPTIONS = new InjectionToken<DatePipeConfig>('DATE_PIPE_DEFAULT_OPTIONS');

const PLATFORM_OPTIONS = Intl.DateTimeFormat().resolvedOptions();

provide(LOCALE_ID, PLATFORM_OPTIONS.locale);

provide(DATE_PIPE_DEFAULT_OPTIONS, { dateFormat: PLATFORM_OPTIONS.dateStyle, timezone: PLATFORM_OPTIONS.timeZone });
