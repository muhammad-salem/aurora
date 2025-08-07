import { Component, OnInit } from '@ibyar/aurora';


export type Hero = {
	id: number;
	title: string;
};


@Component({
	selector: 'track-by-component',
	template: `
		<div class="row">
			<div class="col-10">
				<div class="row p-2">
					snapshot
					<div *for="const hero of snapshot; trackBy trackById; let i = index;">
						#{{i}} - {{hero.id}} - {{hero.title}}
					</div>
				</div>
				<div class="row p-2">
					*for="const hero of heroes; trackBy trackById; let i = index;"
					<div *for="const hero of heroes; trackBy trackById; let i = index;">
						#{{i}} - {{hero.id}} - {{hero.title}}
					</div>
				</div>
				<div class="row p-2">
					*for="const hero of heroes; trackBy = (index, heroRef) => heroRef.id; let i = index;"
					<div *for="const hero of heroes; trackBy = (index, heroRef) => heroRef.id; let i = index;">
						#{{i}} - {{hero.id}} - {{hero.title}}
					</div>
				</div>
				<div class="row p-2">
					*for="const hero of heroes; trackBy: trackByTitle; let i = index;"
					<div *for="const hero of heroes; trackBy: trackByTitle; let i = index;">
						#{{i}} - {{hero.id}} - {{hero.title}}
					</div>
				</div>
			</div>
			<div class="col-2">
				<div class="btn-group-vertical">
					<button type="button" class="btn btn-outline-primary" @click="shuffle()">Shuffle IDS</button>
				</div>
			</div>
		</div>
	`
})
export class TrackByComponent implements OnInit {

	heroes: Hero[] = [
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
			"title": "Hulk"
		},
		{
			"id": 4,
			"title": "Wolverine"
		}
	];

	snapshot = this.heroes.slice();

	onInit(): void {

	}

	trackById(index: number, hero: Hero): number {
		return hero.id;
	}
	trackByTitle(index: number, hero: Hero): string {
		return hero.title;
	}

	shuffle() {
		let currentIndex = this.heroes.length, randomIndex: number;
		// While there remain elements to shuffle.
		while (currentIndex != 0) {
			// Pick a remaining element.
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;
			// And swap it with the current element.
			[this.heroes[currentIndex], this.heroes[randomIndex]] = [this.heroes[randomIndex], this.heroes[currentIndex]];
		}
	}

}
