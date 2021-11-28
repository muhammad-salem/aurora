import { ReactiveScopeControl, ScopeContext } from '@ibyar/expressions';

export abstract class ChangeDetectorRef {

	/**
	 * used when want to update ui-view like, you want to replace an array with another 
	 * without reflect changes on view until reattached again.
	 */
	abstract detach(): void;

	/**
	 * apply all the not emitted changes, and continue emit in time.
	 */
	abstract reattach(): void;

	/**
	 * apply changes now,
	 * will not effect the state of the detector wither if attached ot not.
	 */
	abstract markForCheck(): void;
}

class ChangeDetectorRefImpl extends ChangeDetectorRef {
	constructor(private changeDetectorRef: ChangeDetectorRef) { super(); }
	detach(): void {
		this.changeDetectorRef.detach();
	}
	reattach(): void {
		this.changeDetectorRef.reattach();
	}
	markForCheck(): void {
		this.changeDetectorRef.markForCheck();
	}
}

export function createChangeDetectorRef(scope: ReactiveScopeControl<ScopeContext>, propertyKey?: keyof ScopeContext): ChangeDetectorRef {
	return new ChangeDetectorRefImpl({
		detach() {
			scope.detach();
		},
		reattach() {
			scope.reattach();
		},
		markForCheck() {
			scope.emitChanges(propertyKey);
		}
	} as ChangeDetectorRef);
}
