import { AuroraZone, ManualAuroraZone, ProxyAuroraZone } from './zone.js';

export type ZoneType =
	/**
	 * used when zone.js is disabled, no change detection will applied
	 */
	| 'manual'

	/***
	 * used when zone.js is disabled, try to detection changes using ES6 proxy handler.
	 */
	| 'proxy'

	/***
	 * use when zone.js is active and loaded throw a polyfills file.
	 * 
	 * active  change detection
	 */
	| 'aurora'
	;

const manualAuroraZone = new ManualAuroraZone();
let proxyAuroraZone: ProxyAuroraZone;
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
	} else if ('proxy' === type?.toLowerCase()) {
		auroraZone = proxyAuroraZone = new ProxyAuroraZone();
	} else {
		auroraZone = manualAuroraZone;
	}
}

export function getCurrentZone(type?: ZoneType) {
	if (type) {
		switch (type.toLowerCase()) {
			case 'aurora':
				return auroraZone ?? (auroraZone = new AuroraZone());
			case 'proxy':
				return proxyAuroraZone ?? (proxyAuroraZone = new ProxyAuroraZone());
			default:
			case 'manual': return manualAuroraZone;
		}
	}
	return auroraZone ?? manualAuroraZone;
}
