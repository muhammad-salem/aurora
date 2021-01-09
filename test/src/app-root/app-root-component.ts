import { Component, HTMLComponent, Input, isModel, View } from '@aurorats/core';

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
                .map(tag => tag.trim())
                .map(tag => `<${tag} ></${tag}>`)
                .join('\n');
        } else if (Array.isArray(this.appSelector)) {
            this.apps = this.appSelector
                .map(tagRef => {
                    if (typeof tagRef === 'string') {
                        return `<${tagRef} ></${tagRef}>`;
                    } else {
                        return `<${tagRef.tag} ${tagRef.is ? 'is="' + tagRef.is + '"' : ''}></${tagRef.tag}>`;
                    }
                })
                .join('\n');
        }

        if (isModel(this)) {
            this.emitChangeModel('apps');
        }
    }
}
