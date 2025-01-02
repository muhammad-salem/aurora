const SKIP_CHANGE_DETECTION = new WeakMap<object, boolean>();

export function skipChangeDetection(obj: object) {
	if (obj !== null && typeof obj === 'object') {
		SKIP_CHANGE_DETECTION.set(obj, true);
	}
}

export function isChangeDetectionSkipped(obj: object) {
	return obj !== null && typeof obj === 'object' && SKIP_CHANGE_DETECTION.has(obj);
}
