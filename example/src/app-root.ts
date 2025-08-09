import { Component, ComponentOutlet, LazyOutletComponent, OnInit, output, signal, Type } from '@ibyar/aurora';

export interface App {
	path: string;
	title: string;
	component?: Type<object>;
	load: () => Promise<any>;
}

@Component({
	selector: 'app-root',
	template: `
	<h3>{{selected?.title ?? ''}}</h3>
	<div class="container-fluid w-100 h-100">
		<nav class="nav nav-pills nav-fill gap-1">
			<template *forOf="let app of appList">
				<li class="nav-item">
					<a  class="nav-link" href="javascript:void(0)" 
						[class]="{active: selected?.component == app.component}"
						@click="lazyLoad(app)"
					>{{app.title}}</a>
				</li>
			</template>
		</nav>
		<form>
			<div class="form-check">
				<input class="form-check-input" type="checkbox" id="flexCheckDefault" [(checked)]="show">
				<label class="form-check-label" for="flexCheckDefault">
					Show: {{show}}
				</label>
			</div>
		</form>
		@if(show) {
			<div class="w-100 h-100 d-flex flex-direction-column my-2">
				<div class="w-100 h-100">
					<lazy-outlet [component]="selected?.component"></lazy-outlet>
				</div>
			</div>
		}
		
	</div>`,
	imports: [
		ComponentOutlet,
		LazyOutletComponent,
	]
})
export class AppRoot implements OnInit {

	show = signal(false);

	appList: App[] = [
		{
			path: 'track-by',
			title: 'Track By Example',
			load: () => import('./directive/track-by-example.js').then(module => module.TrackByComponent),
		},
		{
			path: 'directives',
			title: 'Directives',
			load: () => import('./person-app/person-app.js').then(module => module.PersonApp),
		},
		{
			path: 'pipes',
			title: 'Pipes',
			load: () => import('./pipe-app/pipe-test.js').then(module => module.PipeAppComponent),
		},
		{
			path: 'two-way-binding',
			title: 'Two way Binding',
			load: () => import('./two-way/binding-2-way.js').then(module => module.Binding2Way),
		},
		{
			path: 'editor',
			title: 'Editor',
			load: () => import('./two-way/shared-model.js').then(module => module.EditorApp),
		},
		{
			path: 'video-play-list',
			title: 'Play List',
			load: () => import('./video-player/video.js').then(module => module.VideoPlayList),
		},
		{
			path: 'http-fetch',
			title: 'HTTP Fetch',
			load: () => import('./fetch/fetch-app.js').then(module => module.FetchApp),
		},
		{
			path: 'expression-editor',
			title: 'Expression Editor',
			load: () => import('./expression-editor/expression-editor.component.js').then(module => module.ExpressionEditorComponent),
		},
		{
			path: 'custom-advanced-form',
			title: 'Custom Advanced Form',
			load: () => import('./forms/advanced-form.js').then(module => module.AdvancedForm),
		},
		{
			path: 'custom-simple-form',
			title: 'Custom Simple Form',
			load: () => import('./forms/simple-form.js').then(module => module.SimpleForm),
		},
		{
			path: 'form-group',
			title: 'Form Group Component',
			load: () => import('./form-group/form-group.component.js').then(module => module.FormGroupComponent),
		},
		{
			path: 'host-color-picker',
			title: 'Host Color Picker',
			load: () => import('./color/host-color.component.js').then(module => module.HostColorPickerComponent),
		},
		{
			path: 'automatic-slot',
			title: 'Automatic Slot',
			load: () => import('./slot/automatic-slot.js').then(module => module.ElementDetailsExampleComponent),
		},
		{
			path: 'manual-slot',
			title: 'Manual Slot',
			load: () => import('./slot/manual-slot.js').then(module => module.ManualSlotExample),
		},
		{
			path: 'signal-scope',
			title: 'Signal Scope',
			load: () => import('./signals/signal.js').then(module => module.SimpleCounter),
		},
		{
			path: 'control-flow-syntax',
			title: 'Control Flow Syntax',
			load: () => import('./control-flow/control-flow.js').then(module => module.ControlFlowExample),
		},
		{
			path: 'excel-sheet',
			title: 'Excel Sheet',
			load: () => import('./excel/sheet.js').then(module => module.ExcelSheetComponent),
		},
	];

	selected = signal<App | undefined>();

	test = output<string>();
	eventTest = output<number>();

	onInit(): void {

		setTimeout(() => this.loadPreviousApp(), 0);
		this.test.emit('data');
		this.eventTest.emit(333);
	}


	loadPreviousApp() {
		const path = window.location.pathname?.substring(1);
		const app = this.appList.find(i => i.path === path) ?? this.appList.at(-1);
		this.lazyLoad(app!);
	}

	lazyLoad(app: App) {
		app.load()
			.then(component => app.component = component)
			.then(() => this.selected.set(app))
			.then(() => window.history.pushState({}, '', app.path))
			.catch(error => console.error(`Error loading component module: ${app.title}`, error));
	}

}
