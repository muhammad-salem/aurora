import {
	AfterViewInit, Component, ExpressionNode, JavaScriptParser,
	LanguageMode, OnInit, Scope, Context, Stack, viewChild,
	ModuleScopeResolver, ModuleSourceProvider, inject,
	ChangeDetectorRef,
} from '@ibyar/aurora';
import { debounceTime, distinctUntilChanged, fromEvent, map } from 'rxjs';

@Component({
	selector: 'expression-editor',
	zone: 'manual',
	template: `
		<div class="content w-100 h-100">
			<div class="box">
				<div class="column column-200">
					<div class="h-25 d-flex flex-column d-flex justify-content-start gap-1">
						<button class="btn"
							*for="let name of examples"
							@click="loadExample(name)"
							[class]="{'btn-outline-primary': example == name, 'btn-link': example != name}"
							>{{name |> replaceUnderscore |> titlecase}}</button>
					</div>
				</div>
				<div>
					<div class="column">
						<h5>/moduleB</h5>
						<textarea #moduleB cols="40" rows="500">...</textarea>
					</div>
					<div class="column">
						<h5>/moduleA</h5>
						<textarea #moduleA cols="40" rows="200">...</textarea>
					</div>
				</div>
				<div class="column"><pre>{{ast}}</pre></div>
				<div class="column">
					<div class="d-flex flex-column">
						<pre class="text-success">{{str}}</pre>
						<button class="btn btn-outline-primary" (click)="executeCode()">Run</button>
						<pre class="text-secondary" #logs></pre>
						<pre class="text-danger" #error></pre>
					</div>
				</div>
			</div>
		</div>
		`,
	styles: `
		.content {
			flex: 1;
			display: flex;
		}

		.box {
			display: flex;
			min-height: min-content;
		}

		.column {
			padding: 20px;
			border-right: 1px solid #999;
			overflow-y: auto;
			max-width: 700px;
		}

		.column-200 {
			width: 200px;
		}

		textarea {
			height: 750px;
			overflow: unset !important;
		}
	`,
})
export class ExpressionEditorComponent implements OnInit, AfterViewInit {

	ast = '';
	str = '';

	node: ExpressionNode;

	moduleA = viewChild<HTMLTextAreaElement>('moduleA');

	moduleB = viewChild<HTMLTextAreaElement>('moduleB');

	logs = viewChild<HTMLPreElement>('logs');

	error = viewChild<HTMLPreElement>('error');

	examples = [
		'FUNCTION_SCOPES',
		'IMPORT_ALL',
		'IMPORT_DEFAULT',
		'IMPORT_NAMED',
		'IMPORT_NAMED_ALIAS',
		'PLAY',
		'CLASS_EXAMPLE',
		'CLASS_SUPER_EXAMPLE',
	];
	example: string;


	private _cd = inject(ChangeDetectorRef);

	onInit(): void {
		this.loadExample('FUNCTION_SCOPES');
	}

	loadExample(name: keyof typeof import('./expression.spec.js')) {
		this.example = name;
		import('./expression.spec.js')
			.then(module => (this.error.get().innerText = '', module))
			.then(module => this.loadCode(module[name]))
			.then(code => this.moduleB.get().value = code!)
			.then(() => this._cd.detectChanges());
	}

	afterViewInit(): void {
		fromEvent(this.moduleB.get(), 'change')
			.pipe(
				map(() => this.moduleB.get().value),
				debounceTime(400),
				distinctUntilChanged(),
			).subscribe(code => this.loadCode(code));
		import('./expression.spec.js').then(module => this.moduleA.get().value = module.MODULE_A);
	}

	loadCode(code: string | null | undefined) {
		if (!code) {
			this.ast = '';
			this.str = '';
			return;
		}
		try {
			const node = JavaScriptParser.parse(code, { mode: LanguageMode.Strict });
			this.ast = JSON.stringify(node.toJSON(), undefined, 2);
			this.str = node.toString();
			this.node = node;
		} catch (e: any) {
			this.error.get().innerText = e.stack ?? e ?? 'exception';
			console.error(e);
		} finally {
			this._cd.detectChanges();
		}
		return code;
	}

	stringify(str: any) {
		if (typeof str !== 'object') {
			return str;
		}
		return JSON.stringify(str, undefined, 1);
	}

	executeCode() {
		this.logs.get().innerText = '';
		this.error.get().innerText = '';
		try {
			const mockConsole = {
				log: (...data: any[]): void => {
					this.logs.get().innerText += data.map(item => this.stringify(item)).join(' ').concat('\n');
					console.log(...data);
				},
			};
			mockConsole.log('run code...');
			const context: Context = { Object, console: mockConsole };
			const stack = new Stack(Scope.for(context));
			const fileProvider: ModuleSourceProvider = {
				'/moduleA': this.moduleA.get().value,
				'/moduleB': this.moduleB.get().value,
			};
			const resolver = new ModuleScopeResolver(stack, fileProvider, { allowImportExternal: false });
			resolver.resolve('/moduleB');
		} catch (e: any) {
			this.error.get().innerText = e.stack ?? e ?? 'exception';
			console.error(e);
		} finally {
			this._cd.detectChanges();
		}
	}

	replaceUnderscore(title: string) {
		return title.replace(/_/g, ' ');
	}

}