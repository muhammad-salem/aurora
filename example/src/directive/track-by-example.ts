import { Component, OnInit } from '@ibyar/aurora';


export type Hero = {
	id: number;
	title: string;
};


@Component({
	selector: 'track-by-component',
	template: `
		<div *for="const hero of heros; trackBy trackByMethod">
			{{hero.id}} - {{hero.title}}
		</div>
	`
})
export class TrackByComponent implements OnInit {

	heros: Hero[] = [
		{
			"id": 1,
			"title": "Super Man"
		},
		{
			"id": 2,
			"title": "Spider Man"
		},
		{
			"id": 3,
			"title": "Aladdin"
		},
		{
			"id": 4,
			"title": "Downton Abbey"
		}
	];
	onInit(): void {

	}

	trackByMethod(index: number, hero: Hero): number {
		return hero.id;
	}

}
