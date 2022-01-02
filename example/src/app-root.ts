import { Component } from '@ibyar/aurora';

@Component({
	selector: 'app-root',
	template: `
	<div class="container-fluid" >
		<nav class="nav nav-pills nav-fill">
			<template *forOf="let app of appList">
				<li class="nav-item">
					<a  class="nav-link" href="javascript:void(0)" 
						[class]="{active: selector == app.selector}"
						@click="selector = app.selector"
						>{{app.title}}</a>
				</li>
			</template>
		</nav>
		<div class="row">
			<div class="col-12">
				<router-outlet [selector]="selector"></router-outlet>
			</div>
		</div>
	</div>`
})
export class AppRoot {
	selector: string = 'pipe-app';

	appList: { selector: string, title: string }[] = [
		{
			selector: 'pipe-app',
			title: 'Pipes app'
		},
		{
			selector: 'bind-2way',
			title: 'Binding 2 way Example'
		},
		{
			selector: 'app-edit',
			title: 'Edit'
		},
		{
			selector: 'video-play-list',
			title: 'Play List'
		},
		{
			selector: 'person-app',
			title: 'Person App'
		},
		{
			selector: 'user-list',
			title: 'HTTP fetch'
		},
	];
}
