import { AfterViewInit, Component, HTMLComponent, Input, View } from '@aurorats/core';


@Component({
    selector: 'app-root'
})
export class AppRoot implements AfterViewInit {

    @Input('selector')
    appSelector: string | string[];

    @View()
    view: HTMLComponent<AppRoot>;

    afterViewInit() {
        let apps: string = 'no apps provided';
        if (typeof this.appSelector === 'string') {
            apps = this.appSelector.split(',')
                .map(tag => tag.trim())
                .map(tag => `<${tag} ></${tag}>`)
                .join('\n');
        } else if (Array.isArray(this.appSelector)) {
            apps = this.appSelector
                .map(tag => tag.trim())
                .map(tag => `<${tag} ></${tag}>`)
                .join('\n');
        }
        this.view.innerHTML = apps;
    }

}