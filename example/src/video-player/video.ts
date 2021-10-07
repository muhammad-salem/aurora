import { Component, isModel, OnInit, View } from '@ibyar/aurora';

@Component({
	selector: 'video-player',
	extend: 'video',
	encapsulation: 'shadow-dom', // will be ignored 'video' element can't attach shadow dom, it already applied before
	shadowDomMode: 'open', // will be ignored
	shadowDomDelegatesFocus: true // will be ignored
})
export class VideoPlayer implements OnInit {
	@View()
	player: HTMLVideoElement;

	onInit() {
		console.log('src', this.player.src);
	}
}

@Component({
	selector: 'video-play-list',
	template: `
	<div class="row">
		<div class="col-12" *for="let fileName of names">
			<a href="#" (click)="allowLoad && playVideo(fileName)">{{fileName}}</a>
		</div>
	</div>
	<video-player *if="file; else noMedia" controls autoplay name="media">
		<source [src]="file" type="video/mp4" />
	</video-player>
	<template #noMedia>No Video Source Found</template>
	`
})
export class VideoPlayList {

	allowLoad = true;

	names: string[] = [
		'http://github.com/mediaelement/mediaelement-files/blob/master/big_buck_bunny.mp4?raw=true',
	];
	file: string | undefined = undefined;

	playVideo(fileName: string) {
		this.file = fileName;
		console.log(fileName);
		if (isModel(this)) {
			this.emitChangeModel('file');
		}
	}

}
