import { Component, ExpressionNode, JavaScriptAppParser, OnInit } from '@ibyar/aurora';


@Component({
	selector: 'expression-editor',
	template: `<div class="row">
		<div class="col-6">
			<div class="col-12"><pre>{{code}}</pre></div>
			<div class="col-12"><pre>{{str}}</pre></div>
		</div>
		<div class="col-6"><pre>{{ast}}</pre></div>
	</div>`
})
export class ExpressionEditorComponent implements OnInit {

	code = '';
	ast = '';
	str = '';
	node: ExpressionNode;

	onInit(): void {
		import('./expression.spec.js').then(module => this.loadCode(module.default));
	}

	loadCode(code: string) {
		this.code = code;
		try {
			const node = JavaScriptAppParser.parse(code);
			this.ast = JSON.stringify(node.toJSON(), undefined, 2);
			this.str = node.toString();
			this.node = node;

		} catch (error: any) {
			this.ast = error.message;
		}
	}

}