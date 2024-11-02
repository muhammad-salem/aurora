import { ReactiveScopeControl, Context } from '@ibyar/expressions';

export abstract class ChangeDetectorRef {

	/**
	 * used when want to update ui-view like, you want to replace an array with another 
	 * without reflect changes on view until reattached again.
	 */
	abstract detach(): void;

	/**
	 * apply all the not emitted changes, and continue emit changes now.
	 */
	abstract reattach(): void;

	/**
	 * apply changes now,
	 * will not effect the state of the detector wither if attached ot not.
	 */
	abstract markForCheck(): void;

	/**
	 * apply change detection
	 */
	abstract detectChanges(): void;


	/**
	 * throw error if any changes has been made
	 */
	abstract checkNoChanges(): void;
}

class ChangeDetectorRefImpl extends ChangeDetectorRef {

	constructor(private ref: ChangeDetectorRef) {
		super();
	}

	detach(): void {
		this.ref.detach();
	}
	reattach(): void {
		this.ref.reattach();
	}
	markForCheck(): void {
		this.ref.markForCheck();
	}
	detectChanges(): void {
		this.ref.detectChanges();
	}
	checkNoChanges(): void {
		this.ref.checkNoChanges();
	}
}

/**
 * create a change Detector Reference by property key.
 */
export function createChangeDetectorRef(scope: ReactiveScopeControl<any>, propertyKey: keyof Context): ChangeDetectorRef {
	return new ChangeDetectorRefImpl({
		detach() {
			scope.detach();
		},
		reattach() {
			scope.reattach();
		},
		markForCheck() {
			scope.emitChanges(propertyKey, scope.get(propertyKey));
		},
		detectChanges() {
			scope.detectChanges();
		},
		checkNoChanges() {
			scope.checkNoChanges();
		},
	});
}

export function createModelChangeDetectorRef(resolver: () => ReactiveScopeControl<any>): ChangeDetectorRef {
	return new ChangeDetectorRefImpl({
		detach() {
			resolver().detach();
		},
		reattach() {
			resolver().reattach();
		},
		markForCheck() {
			resolver().detectChanges()
		},
		detectChanges() {
			resolver().detectChanges();
		},
		checkNoChanges() {
			resolver().checkNoChanges();
		},
	});
}
