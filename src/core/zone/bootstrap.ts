import { AuroraZone, NoopAuroraZone } from './zone.js';

export type ZoneType =
	/**
	 * used when zone.js is disabled, no change detection will applied
	 */
	| 'noop'
	| 'NOOP'

	/***
	 * use when zone.js is active and loaded throw a polyfills file.
	 * 
	 * active  change detection
	 */
	| 'aurora'
	| 'AURORA'
	;

const noopAuroraZone = new NoopAuroraZone();
let auroraZone: AuroraZone;

/**
 * call once to init the aurora zone, for the platform
 */
export function bootstrapZone(type?: ZoneType) {
	if (auroraZone) {
		return;
	}
	if ('aurora' === type?.toLowerCase()) {
		auroraZone = new AuroraZone();
	} else {
		auroraZone = noopAuroraZone;
	}
}

export function getAuroraZone(type?: ZoneType) {
	if (type) {
		switch (type) {
			case 'aurora':
			case 'AURORA':
				return auroraZone ?? (auroraZone = new AuroraZone())
			default:
			case 'noop':
			case 'NOOP': return noopAuroraZone;
		}
	}
	return auroraZone ?? noopAuroraZone;
}
