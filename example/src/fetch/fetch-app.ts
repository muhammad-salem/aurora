import { Component, OnInit } from '@ibyar/aurora';


@Component({
	selector: 'fetch-app',
	template: `	<div class="row gx-5">
		<div class="col">
			<ul class="list-group">
				<li *for="let item of list" class="list-group-item" [class]="{'active': selected === item}" @click="selected = item">
					{{item}}
				</li>
			</ul>
		</div>
		<div class="col">
			<button type="button" class="btn btn-link" @click="move(list.indexOf(selected), -1)">UP</button>
			<button type="button" class="btn btn-link" @click="move(list.indexOf(selected), +1)">Down</button>
			<button type="button" class="btn btn-link" @click="list.sort()">SORT</button>
			<button type="button" class="btn btn-link" @click="delete(list.indexOf(selected))">DELETE</button>
			<button type="button" class="btn btn-link" @click="appendItem()">APPEND</button>
		</div>
	</div>`
})
export class FetchApp implements OnInit {
	list: number[] = [];
	selected: number = 1;

	onInit(): void {
		fetch('/web_modules/@ibyar/example/dist/fetch/data.json')
			.then(response => response.json())
			.then((list: string[]) => this.list = list.map(i => +i));
	}

	move(index: number, direction: number) {
		if (!this.list) {
			return;
		}
		const item = this.list.splice(index, 1)[0];
		if (!item) {
			return;
		}
		this.list.splice(index + direction, 0, item);
	}
	delete(index: number) {
		this.selected = this.list.at(index - 1) ?? 0;
		return this.list.splice(index, 1)[0];
	}
	appendItem() {
		this.list.push(this.list.length > 0 ? Math.max.apply(Math, this.list) + 1 : 0);
		this.selected = this.list.length - 1;
	}
}