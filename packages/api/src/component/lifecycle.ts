export interface OnChanges {
	onChanges(): void;
}
export function isOnChanges(object: any): object is OnChanges {
	return 'onChanges' in object;
}

export interface OnInit {
	onInit(): void;
}
export function isOnInit(object: any): object is OnInit {
	return 'onInit' in object;
}

export interface DoCheck {
	doCheck(): void;
}
export function isDoCheck(object: any): object is DoCheck {
	return 'doCheck' in object;
}

export interface AfterContentInit {
	afterContentInit(): void;
}
export function isAfterContentInit(object: any): object is AfterContentInit {
	return 'afterContentInit' in object;
}

export interface AfterContentChecked {
	afterContentChecked(): void;
}
export function isAfterContentChecked(
	object: any
): object is AfterContentChecked {
	return 'afterContentChecked' in object;
}

export interface AfterViewInit {
	afterViewInit(): void;
}
export function isAfterViewInit(object: any): object is AfterViewInit {
	return 'afterViewInit' in object;
}

export interface AfterViewChecked {
	afterViewChecked(): void;
}
export function isAfterViewChecked(object: any): object is AfterViewChecked {
	return 'afterViewChecked' in object;
}

export interface OnDestroy {
	onDestroy(): void;
}
export function isOnDestroy(object: any): object is OnDestroy {
	return 'onDestroy' in object;
}
