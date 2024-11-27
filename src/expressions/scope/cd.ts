
const SKIP_CHANGE_DETECTION = Symbol('NO_CD');


export function skipChangeDetection(obj: object) {
	Reflect.set(obj, SKIP_CHANGE_DETECTION, true);
}

export function isChangeDetectionSkipped(obj: object) {
	return Reflect.get(obj, SKIP_CHANGE_DETECTION) === true;
}
