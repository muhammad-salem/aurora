export type AriaBusy = boolean;

export type AriaLive = 'assertive' | 'off' | 'polite';

export type AriaRelevant = 'additions' | 'removals' | 'text' | 'additions text' | 'all';


export type AriaAtomic = boolean;

export interface LiveRegionModel {
	ariaBusy: AriaBusy,
	ariaLive: AriaLive,
	ariaRelevant: AriaRelevant,
	ariaAtomic: AriaAtomic,
}

export const LiveRegionAttributes = [
	'aria-busy',
	'aria-live',
	'aria-relevant',
	'aria-atomic',
];
