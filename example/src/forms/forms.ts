import { Component, Input, OnInit, ValueControl, View, WriteValueOptions } from '@ibyar/aurora';

@Component({
	selector: 'custom-message',
	template: `
			<label for="message" class="form-label">Message</label>
			<textarea class="form-control"
				id="message"
				rows="3"
				[(value)]="message" 
				[disabled]="disabled" 
				(change)="onMessageChange($event.target.value)">
			</textarea>
			<button class="btn btn-outline-primary mb-3" (click)="updateMessage()">Force Update Message</button>
	  	`,
	formAssociated: true,
})
export class CustomMessage implements ValueControl<string> {

	private message: string | null = '';
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
	template: `<input type="number" class="form-control" [id]="elId">`,
	formAssociated: CustomInputValueControl,
})
export class CustomInputElement {

	@Input()
	elId: string;

}

@Component({
	selector: 'custom-form',
	template: `
			<div class="mb-3">
				<label for="custom-input" class="form-label">Index</label>
				<custom-input elId="custom-input" [(value)]="model.index"></custom-input>
			</div>
			<div class="mb-3">
				<custom-message [(value)]="model.message"></custom-message>
			</div>
	  	`,
})
export class CustomForm {

	model = {
		index: 5,
		message: '',
	};

}
