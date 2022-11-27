import { Component, OnInit } from '@ibyar/aurora';
import { FormBuilder, FormGroup, Validators } from '@ibyar/forms';

type User = { name: string, age: number };

@Component({
	selector: 'form-group-component',
	template: `<form [formGroup]="group">
		<label for="name">User name:</label>
		<input id="name" name="name" type="text"/>

		<label for="age">User age:</label>
		<input id="age" name="age" type="number"/>


		<button id="submit" type="submit">Submit</button>
	</form>`,
})
export class FormGroupComponent implements OnInit {

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