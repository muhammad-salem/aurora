import { hasBindingHook, RevocableProxy } from '@ibyar/expressions';
import { ProxyAuroraZone } from './zone.js';

const ProxyCache = new WeakMap<any, ZoneProxyHandler<any>>();

/**
 * crete new proxy handler for object
 */
export class ZoneProxyHandler<T extends object> implements ProxyHandler<T> {
	constructor(private _zone: ProxyAuroraZone) { }
	defineProperty(target: T, p: string | symbol, attributes: PropertyDescriptor): boolean {
		this._zone.scheduleChangesDetection();
		return Reflect.defineProperty(target, p, attributes);
	}
	deleteProperty(target: T, p: string | symbol): boolean {
		this._zone.scheduleChangesDetection();
		return Reflect.deleteProperty(target, p);
	}
	get(target: T, p: string | symbol, receiver: any): any {
		const value = Reflect.get(target, p, receiver);
		if (ProxyCache.has(value)) {
			return ProxyCache.get(value);
		}
		if (!(value && typeof value === 'object') || hasBindingHook(value)) {
			return value;
		}
		const proxy = createZoneProxyHandler(value, this._zone);
		ProxyCache.set(value, proxy);
		return proxy;
	}
	set(target: T, p: string | symbol, value: any, receiver: any): boolean {
		this._zone.scheduleChangesDetection();
		return Reflect.set(target, p, value, receiver);
	}
}

export function createRevocableZoneProxyHandler<T extends object>(model: T, zone: ProxyAuroraZone): RevocableProxy<T> {
	return Proxy.revocable<T>(model, new ZoneProxyHandler(zone));
}

export function createZoneProxyHandler<T extends object>(model: T, zone: ProxyAuroraZone): T {
	return new Proxy<T>(model, new ZoneProxyHandler(zone));
}
