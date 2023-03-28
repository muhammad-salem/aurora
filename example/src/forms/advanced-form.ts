import { Component, HostListener, Input, Metadata, MetadataContext, OnInit, ValueControl, WriteValueOptions } from '@ibyar/aurora';

@Component({
	selector: 'custom-textarea',
	extend: 'textarea',
	formAssociated: true,
})
export class CustomTextareaComponent implements OnInit, ValueControl<string> {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	private text: string | null = '';
	private disabled: boolean = false;
	private _onChange: (_: any) => void = () => { };

	onInit() {
		setTimeout(() => this.updateTextarea('test textarea'), 2000);
	}

	writeValue({ value, mode }: WriteValueOptions<string>) {
		this.text = mode !== 'reset' ? value : '';
		console.log('textarea write value', value, 'and mode', mode);
	}

	registerOnChange(fn: (_: any) => void): void {
		this._onChange = fn;
	}

	setDisabledState(isDisabled: boolean) {
		this.disabled = isDisabled;
		console.log('textarea disable change', isDisabled);
	}

	onTextareaChange(text: string) {
		this._onChange(text);
		console.log('textarea value change', text);
	}

	updateTextarea(text: string) {
		this.text = text;
		this.onTextareaChange(text);
	}

}


@Component({
	selector: 'custom-message',
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
export class CustomMessage implements ValueControl<string> {

	@Metadata
	static [Symbol.metadata]: MetadataContext;


	@Input('value')
	message: string | null = '';
	private disabled: boolean = false;
	private _onChange: (_: any) => void = () => { };

	writeValue({ value, mode }: WriteValueOptions<string>) {
		this.message = mode !== 'reset' ? value : '';
		console.log('message write value', value, 'and mode', mode);
	}

	registerOnChange(fn: (_: any) => void): void {
		this._onChange = fn;
	}

	setDisabledState(isDisabled: boolean) {
		this.disabled = isDisabled;
		console.log('message disable change', isDisabled);
	}

	onMessageChange(message: string) {
		this._onChange(message);
		console.log('message value change', message);
	}

	updateMessage() {
		this.message = 'test message';
		this.onMessageChange(this.message);
	}

}

export class CustomInputValueControl implements ValueControl<number> {

	private _value: number | null = null;
	private _disabled: boolean = false;
	private _onChange: (_: any) => void = () => { };

	constructor() {
		setTimeout(() => {
			this._value = 666;
			this._onChange(this._value);
		}, 3000);
	}

	writeValue({ value, mode }: WriteValueOptions<number>) {
		this._value = mode !== 'reset' ? value : null;
		console.log('control write value', value, 'and mode', mode);
	}

	registerOnChange(fn: (_: any) => void): void {
		this._onChange = fn;
	}

	setDisabledState(isDisabled: boolean) {
		this._disabled = isDisabled;
		console.log('control disabled state', isDisabled);
	}

}

@Component({
	selector: 'custom-input',
	template: `<input type="number" class="form-control" name="custom-input" [id]="elId" [(value)]="numberValue">`,
	formAssociated: CustomInputValueControl,
})
export class CustomInputElement {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	@Input('id')
	elId: string;

	@Input('value')
	numberValue: number = 99;

}

@Component({
	selector: 'custom-form',
	extend: 'form',
	template: `
			<div class="mb-3">
				<label for="test" class="form-label">test</label>
				<input id="test" name="test" type="text" [(value)]="model.test" />
			</div>
			<div class="mb-3">
				<label for="custom-input" class="form-label">Index</label>
				<custom-input id="custom-input" name="index" [(value)]="model.index"></custom-input>
			</div>
			<div class="mb-3">
				<custom-message name="message" [(value)]="model.message"></custom-message>
			</div>
			<div class="mb-3">
				<label for="custom-textarea" class="form-label">Textarea</label>
				<custom-textarea id="custom-textarea" class="form-control" name="textArea" [(value)]="model.textArea"></custom-textarea>
			</div>
			<div class="mb-3">
				<button type="submit" class="btn btn-outline-success m-3">Submit</button>
			</div>
			<div class="mb-3">
				{{data |> json}}
			</div>
	  	`,
	imports: [
		CustomTextareaComponent,
		CustomMessage,
		CustomInputElement
	]
})
export class AdvancedForm {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	model = {
		test: 'test',
		index: 5,
		message: 'default message',
		textArea: 'default textarea',
	};

	data = {};


	@HostListener('submit', ['$event'])
	onSubmit(event: Event) {
		event.preventDefault();
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
