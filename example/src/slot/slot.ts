import { Component } from '@ibyar/aurora';



@Component({
	selector: 'element-details',
	encapsulation: 'shadow-dom',
	template: `
	<style>
		details {
			font-family: "Open Sans Light", Helvetica, Arial;
		}
		.name {
			font-weight: bold;
			color: #217ac0;
			font-size: 120%;
		}
		h4 {
			margin: 10px 0 -8px 0;
		}
		h4 span {
			background: #217ac0;
			padding: 2px 6px 2px 6px;
		}
		h4 span {
			border: 1px solid #cee9f9;
			border-radius: 4px;
		}
		h4 span {
			color: white;
		}
		dl, dt {
			margin-top: 10px !important;
		}
		.attributes {
			margin-left: 22px;
			font-size: 90%;
		}
		.attributes p {
			margin-left: 16px;
			font-style: italic;
		}
	</style>
	<details>
		<summary>
			<span>
				<code class="name">&lt;<slot name="element-name">NEED NAME</slot>&gt;</code>
				<span class="desc"><slot name="description">NEED DESCRIPTION</slot></span>
			</span>
		</summary>
		<div class="attributes">
			<h4><span>Attributes</span></h4>
			<slot name="attributes"><p>None</p></slot>
		</div>
	</details>
	<hr />`,
})
export class ElementDetailsComponent {

}


@Component({
	selector: 'element-details-example',
	template: `
		<element-details id="1">
			<span slot="element-name">slot</span>
			<span slot="description"> placeholder inside a web
				component that users can fill with their own markup,
				with the effect of composing different DOM trees together.
			</span>
			<dl slot="attributes">
				<dt>name</dt>
				<dd>The name of the slot.</dd>
			</dl>
		</element-details>
		<element-details id="2">
			<span slot="element-name">template</span>
			<span slot="description">A mechanism for holding client-side
				content that is not to be rendered when a page is
				loaded but may subsequently be instantiated during
				runtime using JavaScript.
			</span>
		</element-details>
		<element-details id="empty"></element-details>`
})
export class ElementDetailsExampleComponent {

}
