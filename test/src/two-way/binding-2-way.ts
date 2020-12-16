import { Component, HostListener } from '@aurorats/core';

@Component({
    selector: 'bind-2way',
    template: `
    <input type="text" [(value)]="data" />
    <hr />
    <input type="text" [(value)]="data" />
    <hr />
    <div [textContent]="data + ' ' + data"></div>
    `
})
export class Binding2Way {

    data = '2 way binding';

    @HostListener('data')
    onDataChange() {
        console.log(`data change ==> ${this.data}`);
    }

}