import { Component, OnInit, view } from '@ibyar/aurora';

@Component({
	selector: 'video-player',
	extend: 'video',
	encapsulation: 'shadow-dom', // will be ignored 'video' element can't attach shadow dom, it already applied before
	shadowRootInit: { mode: 'open', delegatesFocus: true }, // will be ignored
})
export class VideoPlayer implements OnInit {

	player = view<'video'>();

	onInit() {
		console.log('src', this.player.src);
	}
}

@Component({
	selector: 'video-play-list',
	template: `
	<div class="row">
		<div class="col-12" *forOf="let fileName of names">
			<a href="javascript:void(0);" (click)="allowLoad && playVideo(fileName)">{{fileName}}</a>
		</div>
	</div>
	<video-player *if="file; else noMedia" controls autoplay name="media">
		<source [src]="file" type="video/mp4" />
	</video-player>
	<template #noMedia>No Video Source Found</template>
	`,
	imports: [VideoPlayer]
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
	}

}
