

export interface DirectiveNodeOptions {

	/**
	 * list of attributes name 
	 * consists of inputs and outputs and normal attributes
	 */
	attributes?: string[];
}

export class DirectiveRegistry {

	/**
	 * store options info about directives
	 */
	private directives = new Map<string, DirectiveNodeOptions>();

	/**
	 * register a directive with a name,
	 * if the directive name exists, will not replace the old directive options
	 * @param directiveName 
	 * @param options contain the attributes of the registered directive name
	 * @override
	 */
	register(directiveName: string, options?: DirectiveNodeOptions): void {
		if (!this.directives.has(directiveName)) {
			this.directives.set(directiveName, options ?? {});
		}
	}

	/**
	 * replace the current options with a new one.
	 * if the directive name not exists, no set options will be done
	 * @param directiveName 
	 * @param options to be replaced
	 */
	replace(directiveName: string, options: DirectiveNodeOptions): void {
		if (this.directives.has(directiveName)) {
			this.directives.set(directiveName, options);
		}
	}

	/**
	 * check if directive name is registered
	 * @param directiveName 
	 * @returns `boolean`
	 */
	has(directiveName: string): boolean {
		return this.directives.has(directiveName);
	}

	/**
	 * get the DirectiveOptions for a directive name
	 * @param directiveName 
	 * @returns `DirectiveOptions` if the name has been registered, otherwise `undefined`
	 */
	get(directiveName: string): DirectiveNodeOptions | undefined {
		return this.directives.get(directiveName);
	}

	/**
	 * check if the options registered with a `directiveName` has attributes array
	 * @param directiveName 
	 * @returns `boolean`
	 */
	hasAttributes(directiveName: string): boolean {
		return (this.directives.get(directiveName)?.attributes?.length ?? 0) > 0;
	}

	/**
	 * get the value of the registered attributes with a directive
	 * @param directiveName 
	 * @returns array of strings if found, otherwise `undefined`
	 */
	getAttributes(directiveName: string): string[] | undefined {
		return this.directives.get(directiveName)?.attributes;
	}

}

export const directiveRegistry = new DirectiveRegistry();
