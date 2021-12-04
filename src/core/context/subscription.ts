import { ScopeSubscription } from '@ibyar/expressions';

export function createSubscriptionDestroyer(unsubscribe: () => void, pause?: () => void, resume?: () => void): ScopeSubscription<void> {
	return {
		pause(): void {
			pause?.();
		},
		resume(): void {
			resume?.();
		},
		unsubscribe(): void {
			console.log('unsubscribe');
			unsubscribe();
		},
	} as ScopeSubscription<void>;
}
