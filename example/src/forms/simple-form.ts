import { Component, FormValue, HostListener, Input, OnChanges, OnInit, ValueControl, WriteValueMode, WriteValueOptions } from '@ibyar/aurora';

@Component({
	selector: 'simple-custom-textarea',
	extend: 'textarea',
	formAssociated: true,
})
export class SimpleCustomTextareaComponent implements OnInit, ValueControl<string> {


	private text: string | null = '';

	private _onChange: (_: any) => void = () => { };

	onInit() {
		setTimeout(() => this.updateTextarea('test textarea'), 2000);
		console.log(this);
	}

	updateTextarea(text: string) {
		this.text = text;
		this._onChange(text);
	}
	writeValue(opt: WriteValueOptions<string>): void {
		this.text = opt.mode !== 'reset' ? opt.value : '';
	}
	registerOnChange(fn: (value?: string | null | undefined) => void): void {
		this._onChange = fn;
	}

	onChanges(): void {
		console.log(JSON.parse(JSON.stringify(this)));
	}

}


@Component({
	selector: 'simple-custom-message',
	template: `
			<label for="message" class="form-label">Message</label>
			<textarea class="form-control"
				id="message"
				name="message-textarea"
				rows="3"
				[(value)]="message" 
				[disabled]="disabled" 
				(change)="onMessageChange($event.target.value)">
			</textarea>
			<button type="button" class="btn btn-outline-primary m-3" (click)="updateMessage()">Update Message</button>
	  	`,
	formAssociated: true,
})
export class SimpleCustomMessage {


	@Input('value') message: string | null = '';

	updateMessage() {
		this.message = 'test message';
	}

}

@Component({
	selector: 'simple-custom-input',
	template: `<input type="number" class="form-control" name="custom-input" [id]="elId" [(value)]="numberValue">`,
	formAssociated: true,
})
export class SimpleCustomInputElement implements OnInit {

	@Input('id')
	elId: string;

	@FormValue()
	numberValue: number = 99;

	onInit() {
		setTimeout(() => {
			this.numberValue = 666;
		}, 3000);
	}

}

@Component({
	selector: 'simple-custom-form',
	extend: 'form',
	template: `
			<div class="mb-3">
				<label for="test" class="form-label">test</label>
				<input id="test" name="test" type="text" [(value)]="model.test" />
			</div>
			<div class="mb-3">
				<label for="custom-input" class="form-label">Index</label>
				<simple-custom-input id="custom-input" name="index" [(value)]="model.index"></simple-custom-input>
			</div>
			<div class="mb-3">
				<simple-custom-message name="message" [(value)]="model.message"></simple-custom-message>
			</div>
			<div class="mb-3">
				<label for="custom-textarea" class="form-label">Textarea</label>
				<simple-custom-textarea id="custom-textarea" class="form-control" name="textArea" [(value)]="model.textArea"></simple-custom-textarea>
			</div>
			<div class="mb-3">
				<button type="submit" class="btn btn-outline-success m-3">Submit</button>
			</div>
			<div class="mb-3">
				{{data |> json}}
			</div>
	  	`,
})
export class SimpleForm {

	model = {
		test: 'test',
		index: 5,
		message: 'default message',
		textArea: 'default textarea',
	};

	data = {};


	@HostListener('submit', ['$event'])
	onSubmit(event: Event) {
		console.log('$event', event);
		const formData = new FormData(event.target as HTMLFormElement);
		const collect = {};
		formData.forEach((value, key) => Reflect.set(collect, key, value));
		this.data = collect;
		console.log('data', this.data);
	}

	@HostListener('formdata', ['$event'])
	onFormData(event: FormDataEvent) {
		console.log('formData', event.formData);
		event.formData.forEach((value, key) => console.log('key', key, 'value', value));
	}

}
