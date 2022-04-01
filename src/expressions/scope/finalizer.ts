type Actions = (() => void)[];
const actionsFinalizer = !FinalizationRegistry ? undefined : new FinalizationRegistry<Actions>(
	actions => actions.forEach(action => { try { action(); } catch (e) { } })
);


export function finalizerRegister(target: object, actions: Actions, unregisterToken?: object): void {
	actionsFinalizer?.register(target, actions, unregisterToken);
}


export function finalizerUnregister(unregisterToken: object): void {
	actionsFinalizer?.unregister(unregisterToken);
}
