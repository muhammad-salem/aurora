import { AuroraZone, AuroraZoneType, NoopAuroraZone } from './zone.js';

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

export let auroraZone: AuroraZoneType;

/**
 * call once to init the aurora zone
 */
export function bootstrapZone(type?: ZoneType) {
	if (auroraZone) {
		return;
	}
	if ('aurora' === type?.toLowerCase()) {
		auroraZone = new AuroraZone();
	} else {
		auroraZone = new NoopAuroraZone()
	}
}
