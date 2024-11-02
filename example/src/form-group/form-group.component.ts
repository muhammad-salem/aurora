import { Component, inject, OnInit } from '@ibyar/aurora';
import { FormBuilder, FormGroup, Validators } from '@ibyar/forms';


type Parent = {
	name: string,
	age: number,
};

type Friend = {
	name: string,
	age: number,
};

type User = {
	name: string,
	age: number,
	parent: Parent;
	friends: Friend[];
};

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

	private _fb = inject(FormBuilder);

	group: FormGroup<any>;

	onInit(): void {
		this.group = this._fb.group<User>({
			name: this._fb.control('user name', { validators: [Validators.required()] }),
			age: this._fb.control(15),
			parent: this._fb.group({
				name: this._fb.control('parent name', { validators: [Validators.required()] }),
				age: this._fb.control(35),
			}),
			friends: this._fb.array([
				this._fb.group({
					name: this._fb.control('friend name', { validators: [Validators.required()] }),
					age: this._fb.control(15),
				})
			]),
		});
		console.log('group', this.group);
	}

}
