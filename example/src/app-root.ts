import { Component, OnInit, TypeOf } from '@ibyar/aurora';
import { ComponentOutlet } from './route/component-outlet.js';

export interface App {
	title: string;
	component?: TypeOf<object>;
	load: () => Promise<any>;
}

@Component({
	selector: 'app-root',
	template: `
	<h3>{{appName}}</h3>
	<div class="container-fluid w-100 h-100">
		<nav class="nav nav-pills nav-fill gap-1">
			<template *forOf="let app of appList">
				<li class="nav-item">
					<a  class="nav-link" href="javascript:void(0)" 
						[class]="{active: selectedComponent == app.component}"
						@click="lazyLoad(app)"
					>{{app.title}}</a>
				</li>
			</template>
		</nav>
		<div class="w-100 h-100 d-flex flex-direction-column my-2">
			<div class="w-100 h-100">
				<component-outlet [component]="selectedComponent"></component-outlet>
			</div>
		</div>
	</div>`,
	imports: [
		ComponentOutlet,
	]
})
export class AppRoot implements OnInit {

	selectedComponent: TypeOf<object> | null = null;
	selectedApp: App;

	appName: string = '';

	lazyLoad(app: App) {
		this.selectedApp = app;
		this.appName = app.title;
		app.load().then(component => this.selectedComponent = app.component = component);
	}

	appList: App[] = [
		{
			title: 'Track By Example',
			load: () => import('./directive/track-by-example.js').then(module => module.TrackByComponent),
		},
		{
			title: 'Directives',
			load: () => import('./person-app/person-app.js').then(module => module.PersonApp),
		},
		{
			title: 'Pipes',
			load: () => import('./pipe-app/pipe-test.js').then(module => module.PipeAppComponent),
		},
		{
			title: 'Two way Binding',
			load: () => import('./two-way/binding-2-way.js').then(module => module.Binding2Way),
		},
		{
			title: 'Edit',
			load: () => import('./two-way/shared-model.js').then(module => module.EditorApp),
		},
		{
			title: 'Play List',
			load: () => import('./video-player/video.js').then(module => module.VideoPlayList),
		},
		{
			title: 'HTTP Fetch',
			load: () => import('./fetch/fetch-app.js').then(module => module.FetchApp),
		},
		{
			title: 'Expression Editor',
			load: () => import('./expression-editor/expression-editor.component.js').then(module => module.ExpressionEditorComponent),
		},
		{
			title: 'Custom Advanced Form',
			load: () => import('./forms/advanced-form.js').then(module => module.AdvancedForm),
		},
		{
			title: 'Custom Simple Form',
			load: () => import('./forms/simple-form.js').then(module => module.SimpleForm),
		},
		{
			title: 'Form Group Component',
			load: () => import('./form-group/form-group.component.js').then(module => module.FormGroupComponent),
		},
		{
			title: 'Host Color Picker',
			load: () => import('./color/host-color.component.js').then(module => module.HostColorPickerComponent),
		},
		{
			title: 'Automatic Slot',
			load: () => import('./slot/automatic-slot.js').then(module => module.ElementDetailsExampleComponent),
		},
		{
			title: 'Manual Slot',
			load: () => import('./slot/manual-slot.js').then(module => module.ManualSlotExample),
		},
		{
			title: 'Scope Signal',
			load: () => import('./signals/signal.js').then(module => module.SimpleCounter),
		},
		{
			title: 'Control Flow',
			load: () => import('./control-flow/control-flow.js').then(module => module.ControlFlowExample),
		}
	];

	onInit(): void {
		this.appName = 'APP NAME';
		setTimeout(() => {
			this.lazyLoad(this.appList.at(-1)!);
		}, 0);
	}

}
