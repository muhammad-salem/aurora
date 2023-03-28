import { Component, Metadata, MetadataContext, OnInit } from '@ibyar/aurora';
import { FormBuilder, FormGroup, Validators } from '@ibyar/forms';

type User = { name: string, age: number };

@Component({
	selector: 'form-group-component',
	template: `<form [formGroup]="group">
		<label for="name" class="form-label">User name:</label>
		<input id="name" name="name" type="text" class="form-control"/>

		<label for="age" class="form-label">User age:</label>
		<input id="age" name="age" type="number" class="form-control"/>


		<button id="submit" class="btn btn-outline-secondary mt-2" type="submit">Submit</button>
	</form>`,
})
export class FormGroupComponent implements OnInit {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	private _fb = new FormBuilder();

	group: FormGroup<any>;

	onInit(): void {
		this.group = this._fb.group({
			name: this._fb.control('user name', { validators: [Validators.required()] }),
			age: this._fb.control(15)
		});
		console.log('group', this.group);

	}


}