import { AfterViewInit, Component, OnInit, view, ViewChild } from '@ibyar/aurora';


@Component({
	selector: 'manual-slot',
	encapsulation: 'shadow-dom',
	shadowRootInit: { mode: 'open', slotAssignment: 'manual' },
	template: `<div class="d-flex">
		<div>
			slot begin
			<slot #slot name="slot-el">NEED DESCRIPTION</slot>
			slot end
		</div>
		<div #div1 slot="slot-el">div A</div>
		<div #div2 slot="slot-el">div B</div>
		<div>
			<button class="btn btn-primary" @click="assignDiv1()">Assign div A</button>
			<button class="btn btn-primary" @click="assignDiv2()">Assign div B</button>
			<button class="btn btn-primary" @click="assign(++count)">Append div {{count + 1}}</button>
		</div>
		<div>
		</div>
	</div>`
})
export class ManualSlotExample implements OnInit, AfterViewInit {

	count = 0;

	view = view(ManualSlotExample);

	@ViewChild('slot')
	slot: HTMLSlotElement;

	@ViewChild('div1')
	div1: HTMLDivElement;

	@ViewChild('div2')
	div2: HTMLDivElement;



	onInit(): void {
		// slot is not defined yet
		if (this.slot !== undefined) {
			console.error('slot should be not defied yet');
		}
	}

	afterViewInit(): void {
		// slot is defined.
		if (this.slot === undefined) {
			console.error('slot should be not `undefined` yet');
		}
		this.slot.addEventListener('slotchange', e => {
			const nodes = this.slot.assignedNodes();
			console.log(`Element in Slot "${this.slot.name}" changed to:`, nodes);
		});
		this.view.append(this.div1);
		this.view.append(this.div2);
	}

	assign(num: number): void {
		const element = document.createElement('div');
		// element.setAttribute('name', 'slot-el');
		element.innerText = 'manual slot assignment ' + num;
		this.view.append(element);
		this.slot.assign(element);
		console.log(this.slot, element);
	}

	assignDiv1(): void {
		this.slot.assign(this.div1);
	}

	assignDiv2(): void {
		this.slot.assign(this.div2);
	}

}
