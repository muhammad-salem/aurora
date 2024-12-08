import { AfterViewInit, Component, OnInit, view, viewChild } from '@ibyar/aurora';


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

	slot = viewChild('slot');
	div1 = viewChild<HTMLDivElement>('div1');
	div2 = viewChild<HTMLDivElement>('div2');


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
		this.slot.get().addEventListener('slotchange', e => {
			const nodes = this.slot.get().assignedNodes();
			console.log(`Element in Slot "${this.slot.get().name}" changed to:`, nodes);
		});
		this.view.append(this.div1.get());
		this.view.append(this.div2.get());
	}

	assign(num: number): void {
		const element = document.createElement('div');
		// element.setAttribute('name', 'slot-el');
		element.innerText = 'manual slot assignment ' + num;
		this.view.append(element);
		this.slot.get().assign(element);
		console.log(this.slot, element);
	}

	assignDiv1(): void {
		this.slot.get().assign(this.div1.get());
	}

	assignDiv2(): void {
		this.slot.get().assign(this.div2.get());
	}

}
