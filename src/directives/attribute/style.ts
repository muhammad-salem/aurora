import { AttributeDirective, Directive, Input, Metadata, MetadataContext } from '@ibyar/core';

type StyleType = string | Array<string> | { [propertyName: string]: string };

@Directive({
	selector: 'style'
})
export class StyleDirective extends AttributeDirective {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	@Input()
	set style(style: StyleType) {
		if (typeof style === 'string') {
			const lines = style.split(/\s{0,};\s{0,}/).filter(str => str);
			for (const line of lines) {
				this._setStyleFromLine(line);
			}
		} else if (Array.isArray(style)) {
			const lines = style.map(str => str.trim()).filter(str => str);
			for (const line of lines) {
				this._setStyleFromLine(line);
			}
		} else if (typeof style === 'object') {
			for (var property in style) {
				this._setStyle(property, style[property]);
			}
		}
	}
	get style() {
		return this.el.style as any;
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
		this.updateStyle(name, value as string, priority);
	}

	private updateStyle(property: string, value: string | null, priority?: string | undefined) {
		if (value != null) {
			this.el.style.setProperty(property, value as string, priority);
		} else {
			this.el.style.removeProperty(property);
		}
	}

}
