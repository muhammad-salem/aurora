import { AfterViewInit, Component, ExpressionNode, JavaScriptParser, LanguageMode, OnInit, Scope, ScopeContext, Stack, ViewChild } from '@ibyar/aurora';
import { debounceTime, distinctUntilChanged, fromEvent, map } from 'rxjs';

const styles = `
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

	.column > pre, textarea {
		height: 750px;
		overflow: unset !important;
	}
`;

@Component({
	selector: 'expression-editor',
	template: `
		<div class="content w-100 h-100">
			<div class="box">
				<div class="column">
					<div class="h-25 d-flex flex-column d-flex justify-content-evenly">
						<button class="btn"
							*for="let name of examples"
							@click="loadExample(name)"
							[class]="{'btn-outline-primary': example == name, 'btn-link': example != name}"
							>{{name |> splitUnderscore |> titlecase}}</button>
					</div>
				</div>
				<div class="column"><textarea #editor cols="40" rows="700">...</textarea></div>
				<div class="column">
					<div class="d-flex flex-column">
						<pre class="text-success">{{str}}</pre>
						<button class="btn btn-outline-primary" (click)="executeCode()">Run</button>
						<pre class="text-secondary" #logs></pre>
						<pre class="text-danger" #error></pre>
					</div>
				</div>
				<div class="column"><pre>{{ast}}</pre></div>
			</div>
		</div>
		`,
	styles: styles,
})
export class ExpressionEditorComponent implements OnInit, AfterViewInit {

	ast = '';
	str = '';

	node: ExpressionNode;

	@ViewChild('editor')
	editor: HTMLTextAreaElement;

	@ViewChild('logs')
	logs: HTMLPreElement;

	@ViewChild('error')
	error: HTMLPreElement;

	examples = [
		'IMPORT_ALL',
		'IMPORT_DEFAULT',
		'IMPORT_NAMED',
		'IMPORT_NAMED_ALIAS',
		'PLAY',
		'CLASS_EXAMPLE'
	];
	example: string;

	onInit(): void {
		this.loadExample('IMPORT_ALL');
	}

	loadExample(name: keyof typeof import('./expression.spec.js')) {
		this.example = name;
		import('./expression.spec.js')
			.then(module => (this.error.innerText = '', module))
			.then(module => this.loadCode(module[name]))
			.then(code => this.editor.value = code!);
	}

	afterViewInit(): void {
		fromEvent(this.editor, 'change')
			.pipe(
				map(() => this.editor.value),
				debounceTime(400),
				distinctUntilChanged(),
			).subscribe(code => this.loadCode(code))
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
			this.error.innerText = e.stack ?? e ?? 'exception';
			console.error(e);
		}
		return code;
	}

	stringify(str: any) {
		return JSON.stringify(str, undefined, 2);
	}

	executeCode() {
		this.logs.innerText = '';
		this.error.innerText = '';
		try {
			const mockConsole = {
				log: (...data: any[]): void => {
					this.logs.innerText += data.map(item => this.stringify(item)).join(' ').concat('\n');
					console.log(...data);
				},
			};
			mockConsole.log('run code...');
			const context: ScopeContext = { console: mockConsole };
			const stack = new Stack(Scope.for(context));
			this.node.get(stack);
		} catch (e: any) {
			this.error.innerText = e.stack ?? e ?? 'exception';
			console.error(e);
		}
	}

	splitUnderscore(title: string) {
		return title.replace(/_/g, ' ');
	}

}