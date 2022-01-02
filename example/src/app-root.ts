import { Component } from '@ibyar/aurora';
import { RouteData } from './index.js';

@Component({
	selector: 'app-root',
	template: `
	<div class="container-fluid" >
		<nav class="nav nav-pills nav-fill">
			<template *forOf="let app of appList">
				<li class="nav-item">
					<a  class="nav-link" href="javascript:void(0)" 
						[class]="{active: currentApp.selector == app.selector}"
						@click="currentApp = app"
						>{{app.title}}</a>
				</li>
			</template>
		</nav>
		<div class="row">
			<div class="col-12">
				<router-outlet [routeData]="currentApp"></router-outlet>
			</div>
		</div>
	</div>`
})
export class AppRoot {

	appList: { selector: string, title: string, is?: string }[] = [
		{
			selector: 'pipe-app',
			title: 'Pipes app'
		},
		{
			selector: 'div',
			title: 'Binding 2 way Example',
			is: 'bind-2way'
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
	currentApp: RouteData = this.appList.filter(app => app.selector === 'pipe-app')[0];
}
