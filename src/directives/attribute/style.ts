import { AttributeDirective, Directive, Input } from '@ibyar/core';

type StyleType = string | Array<string> | { [propertyName: string]: string };

@Directive({
	selector: 'style'
})
export class StyleDirective extends AttributeDirective {

	@Input()
	set styles(styles: StyleType) {
		if (typeof styles === 'string') {
			for (const line of styles.split(';')) {
				this._setStyleFromLine(line);
			}
		} else if (Array.isArray(styles)) {
			for (const line of styles) {
				this._setStyleFromLine(line);
			}
		} else if (typeof styles === 'object') {
			for (var property in styles) {
				this._setStyle(property, styles[property]);
			}
		}
	}
	get styles(): StyleType {
		return this.el.getAttribute('style') as StyleType;
	}

	private _setStyleFromLine(line: string) {
		let split = line.split(':');
		const property = split[0].trim();
		if (split.length === 1) {
			this._setStyle(property);
			return;
		}
		split = split[1].split('!');
		const value = split[0].trim();
		const priority: string | undefined = split[1];
		this._setStyle(property, value, priority);
	}

	private _setStyle(nameAndUnit: string, value?: string | number | null, priority?: string): void {
		const [name, unit] = nameAndUnit.split('.');
		value = value != null && unit ? `${value}${unit}` : value;

		if (value != null) {
			this.el.style.setProperty(name, value as string, priority);
		} else {
			this.el.style.removeProperty(name);
		}
	}

}
