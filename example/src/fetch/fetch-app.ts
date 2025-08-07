import { ChangeDetectorRef, Component, inject, input, OnDestroy, OnInit, OnViewAdopted, OnViewMove, } from '@ibyar/aurora';

@Component({
	selector: 'number-item',
	encapsulation: 'shadow-dom',
	shadowRootInit: { mode: 'closed' },
	template: `{{item}}`
})
export class NumberItemComponent implements OnInit, OnViewMove, OnViewAdopted, OnDestroy {

	item = input.required<number>();

	onInit(): void {
		console.log('model: on inti', this.item.get());
	}

	onViewMove(): void {
		console.log('view: on move', this.item.get());
	}

	onViewAdopted(): void {
		console.log('view: on adopted', this.item.get());
	}

	onDestroy(): void {
		console.log('model: on destroy', this.item.get());
	}

}

@Component({
	selector: 'fetch-app',
	zone: 'manual',
	imports: [NumberItemComponent],
	template: `	<div class="row gx-5">
		<div class="col">
			<ul class="list-group">
				<li *for="let item of list" class="list-group-item" [class]="{'active': selected === item}" @click="selected = item">
					<number-item [item]="item.num"></number-item>
				</li>
			</ul>
		</div>
		<div class="col">
			<button type="button" class="btn btn-link" @click="move(list.indexOf(selected), -1)">UP</button>
			<button type="button" class="btn btn-link" @click="move(list.indexOf(selected), +1)">Down</button>
			<button type="button" class="btn btn-link" @click="sortItems(+1)">SORT</button>
			<button type="button" class="btn btn-link" @click="reversSortItems()">Reverse SORT</button>
			<button type="button" class="btn btn-link" @click="delete(list.indexOf(selected))">DELETE</button>
			<button type="button" class="btn btn-link" @click="appendItem()">APPEND</button>
		</div>
	</div>`
})
export class FetchApp implements OnInit {

	list: { num: number }[] = [];
	selected: { num: number } | undefined;

	private _cd = inject(ChangeDetectorRef);

	onInit(): void {
		fetch('https://raw.githubusercontent.com/ibyar/aurora/dev/example/src/fetch/data.json')
			.then(response => response.json())
			.then((list: string[]) => this.list = list.map(i => ({ num: +i })))
			.then(() => this._cd.markForCheck());
	}

	move(index: number, direction: number) {
		if (!this.list) {
			return;
		}
		if (direction == -1 && index > 0) {
			this.list.splice(index + direction, 2, this.list[index], this.list[index + direction]);
		} else if (direction == 1 && index < this.list.length - 1) {
			this.list.splice(index, 2, this.list[index + direction], this.list[index]);
		}
	}
	delete(index: number): void {
		if (this.selected) {
			this.selected = undefined;
			this.list.splice(index, 1);
		}
	}
	appendItem() {
		const num = this.list.map(i => i.num).reduce((a, b) => Math.max(a, b), 0) + 1;
		this.list.push({ num });
		this.selected = this.list.at(- 1)!;
	}
	sortItems(direction: number) {
		this.list.sort((a, b) => (a.num - b.num) * direction);
	}

	reversSortItems() {
		this.list.reverse();
	}
}
