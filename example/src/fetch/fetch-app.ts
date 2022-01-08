import { Component, Input, OnInit } from '@ibyar/aurora';


@Component({
	selector: 'fetch-app',
	template: `	<ul class="list-group">
					<li  *for="let item of list" class="list-group-item">{{item}}</li>
				</ul>
				`
})
export class FetchApp implements OnInit {
	list?: string[] = undefined;

	onInit(): void {
		fetch('/web_modules/@ibyar/example/dist/fetch/data.json')
			.then(response => response.json())
			.then((list: string[]) => this.list = list);
	}
}