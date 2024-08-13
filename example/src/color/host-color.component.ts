import { Component, HostBinding, HostListener } from '@ibyar/aurora';

@Component({
	selector: 'host-color',
	extend: 'div',
	disabledFeatures: ['internals', 'shadow'],
	template: `
	<div>Click on color name, to change host: background color</div>
	<div *for="let color of colors" data-color="{{color}}">
		{{color}}
	</div>
	<div>Current Color: {{ selectedColor || 'nothing'}}.</div>`
})
export class HostColorPickerComponent {


	colors = [
		'red',
		'blue',
		'green',
		'yellow',
		'purple',
		'fuchsia',
		'lime',
		'teal',
		'aqua',
		'gray',
		'silver',
		'black',
		'white'
	];


	@HostBinding('style.backgroundColor')
	selectedColor = '';


	@HostListener('click', '$event')
	onHostClick(event: Event) {
		const element = event.target as HTMLDivElement & { dataColor: string };
		this.selectedColor = element.dataset.color || '';
	}


}