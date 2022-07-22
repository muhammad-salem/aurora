import type { RevocableProxy } from '@ibyar/expressions';
import { AuroraZone } from './zone.js';

/**
 * crete new proxy handler for object
 */
export class ZoneProxyHandler<T extends object> implements ProxyHandler<T> {
	constructor(private _zone: AuroraZone) { }
	defineProperty(target: T, p: string | symbol, attributes: PropertyDescriptor): boolean {
		return this._zone.run(Reflect.defineProperty, target, [target, p, attributes]);
	}
	deleteProperty(target: T, p: string | symbol): boolean {
		return this._zone.run(Reflect.deleteProperty, target, [target, p]);
	}
	get(target: T, p: string | symbol, receiver: any): any {
		const value = Reflect.get(target, p, receiver);
		if (!(value && typeof value === 'object')) {
			return value;
		}
		return createZoneProxyHandler(value, this._zone);
	}
	set(target: T, p: string | symbol, value: any, receiver: any): boolean {
		return this._zone.run(Reflect.set, target, [target, p, value, receiver]);
	}
}

export function createRevocableZoneProxyHandler<T extends object>(model: T, zone: AuroraZone): RevocableProxy<T> {
	return Proxy.revocable<T>(model, new ZoneProxyHandler(zone));
}

export function createZoneProxyHandler<T extends object>(model: T, zone: AuroraZone): T {
	return new Proxy<T>(model, new ZoneProxyHandler(zone));
}
