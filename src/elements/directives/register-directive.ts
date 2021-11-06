

export interface DirectiveNodeOptions {
	attributes?: string[];
	nextSiblingDirectives?: string[];
}

export class DirectiveRegistry {

	/**
	 * store options info about directives
	 */
	private directives = new Map<string, DirectiveNodeOptions>();


	/**
	 * register a directive with a name.
	 * @param directiveName the directive name
	 */
	register(directiveName: string): void;

	/**
	 * register a directive with a name,
	 * if the directive name exists, will not replace the old directive options
	 * @param directiveName 
	 * @param options contain the attributes of the registered directive name
	 */
	register(directiveName: string, options: DirectiveNodeOptions = {}): void {
		if (!this.directives.has(directiveName)) {
			this.directives.set(directiveName, options);
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

	/**
	 * check if the options registered with a `directiveName` has next sibling directives
	 * @param directiveName 
	 * @returns `boolean`
	 */
	hasNextSiblingDirectives(directiveName: string): boolean {
		return (this.directives.get(directiveName)?.nextSiblingDirectives?.length ?? 0) > 0;
	}

	/**
	 * get the value of the registered next possible sibling directives for a directive name
	 * @param directiveName 
	 * @returns array of strings if found, otherwise `undefined`
	 */
	getNextSiblingDirectives(directiveName: string): string[] | undefined {
		return this.directives.get(directiveName)?.nextSiblingDirectives;
	}

}

export const directiveRegistry = new DirectiveRegistry();
