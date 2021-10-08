import { Component, HTMLComponent, Input, isModel, View } from '@ibyar/aurora';

export type AppSelector = string | (string | { tag: string, is?: string })[]

const APP = Symbol.for('app-parent');
class AppParent {
	@Input()
	date: AppSelector;

	@Input('app')
	[APP]: string;

	name: string;
}

@Component({
	selector: 'app-root',
	template: `<div [innerHTML]="apps"></div>`
})
export class AppRoot extends AppParent {

	apps: string = 'no apps provided';

	@View()
	view: HTMLComponent<AppRoot>;

	@Input()
	set selectors(selectors: AppSelector) {
		if (typeof selectors === 'string') {
			this.apps = selectors.split(',')
				.map(selector => selector.trim())
				.map(selector => `<${selector} ></${selector}>`)
				.join('\n');
		} else if (Array.isArray(selectors)) {
			this.apps = selectors
				.map(selector => {
					if (typeof selector === 'string') {
						return `<${selector} ></${selector}>`;
					} else {
						return `<${selector.tag} ${selector.is ? 'is="' + selector.is + '"' : ''}></${selector.tag}>`;
					}
				})
				.join('\n');
		}

		if (isModel(this)) {
			this.emitChangeModel('apps');
		}
	}
}
