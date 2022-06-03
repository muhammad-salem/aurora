import { AfterViewInit, Component, ExpressionNode, JavaScriptAppParser, OnInit, ViewChild } from '@ibyar/aurora';
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
	}

	.column > pre {
		height: 750px;
		overflow: unset !important;
	}
`;

@Component({
	selector: 'expression-editor',
	template: `
		<div class="content w-100 h-100">
			<div class="box">
				<div class="column">Selector</div>
				<div class="column"><pre #editor contentEditable="true">...</pre></div>
				<div class="column"><pre>{{str}}</pre></div>
				<div class="column"><pre>{{ast}}</pre></div>
			</div>
		</div>
		`,
	styles: styles,
})
export class ExpressionEditorComponent implements OnInit, AfterViewInit {

	ast = '';
	str = '';
	node?: ExpressionNode;

	@ViewChild('editor')
	editor: HTMLPreElement;

	onInit(): void {
		import('./expression.spec.js')
			.then(module => this.loadCode(module.default))
			.then(code => this.editor.innerText = code!);


	}

	afterViewInit(): void {
		fromEvent(this.editor, 'input')
			.pipe(
				debounceTime(400),
				distinctUntilChanged(),
				map(() => this.editor.innerText),
			).subscribe(code => this.loadCode(code))
	}

	loadCode(code: string | null | undefined) {
		if (!code) {
			this.ast = '';
			this.str = '';
			this.node = undefined;
			return;
		}
		try {
			const node = JavaScriptAppParser.parse(code);
			this.ast = JSON.stringify(node.toJSON(), undefined, 2);
			this.str = node.toString();
			this.node = node;
		} catch (e: any) {
			this.ast = e.stack;
			throw e;
		}
		return code;
	}

}