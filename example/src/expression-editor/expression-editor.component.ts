import { Component, ExpressionNode, JavaScriptAppParser, OnInit, ViewChild } from '@ibyar/aurora';

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
				<div #editor class="column"><pre contentEditable="true" (input)="loadCode($event.target.textContent)">...</pre></div>
				<div class="column"><pre>{{str}}</pre></div>
				<div class="column"><pre>{{ast}}</pre></div>
			</div>
		</div>
		`,
	styles: styles,
})
export class ExpressionEditorComponent implements OnInit {

	code = '';
	ast = '';
	str = '';
	node: ExpressionNode;

	@ViewChild('editor')
	editor: HTMLPreElement;

	onInit(): void {
		import('./expression.spec.js')
			.then(module => this.loadCode(module.default))
			.then(code => this.editor.innerText = code)
			.then(code => this.code = code);
	}

	loadCode(code: string) {
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