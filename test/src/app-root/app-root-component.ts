import { Component, HTMLComponent, Input, isModel, View } from '@ibyar/aurora';

export type AppSelector = string | (string | { tag: string, is?: string })[]

@Component({
	selector: 'app-root',
	template: `<div [innerHTML]="apps"></div>`
})
export class AppRoot {

	@Input('selector')
	appSelector: AppSelector;

	apps: string = 'no apps provided';

	@View()
	view: HTMLComponent<AppRoot>;

	setAppSelector(selectors: AppSelector) {
		this.appSelector = selectors;
		if (typeof this.appSelector === 'string') {
			this.apps = this.appSelector.split(',')
				.map(selector => selector.trim())
				.map(selector => `<${selector} ></${selector}>`)
				.join('\n');
		} else if (Array.isArray(this.appSelector)) {
			this.apps = this.appSelector
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
