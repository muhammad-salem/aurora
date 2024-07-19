

export interface DirectiveNodeOptions {

	/**
	 * list of inputs view name
	 */
	inputs?: string[];

	/**
	 * list of outputs view name
	 */
	outputs?: string[];

	/**
	 * successors block/scope for a directive 
	 * 
	 * ex: [`@if`/`@else`] & [`@for`/`@empty`]
	 */
	successor?: string;
}

class DirectiveNodeInfo {
	constructor(private inputs?: string[], private outputs?: string[], private successor?: string) { }

	hasAttributes(): boolean {
		return this.hasInputs() || this.hasOutputs();
	}

	hasInputs(): boolean {
		return (this.inputs?.length ?? 0) > 0;
	}

	hasOutputs(): boolean {
		return (this.outputs?.length ?? 0) > 0;
	}

	hasSuccessors(): boolean {
		return (this.successor?.trim().length ?? 0) > 0;
	}

	getAttributes(): string[] | undefined {
		if (this.inputs && this.outputs) {
			return this.inputs.concat(this.outputs);
		} else if (this.inputs) {
			return this.inputs;
		} else if (this.outputs) {
			return this.outputs;
		}
		return undefined;
	}

	getInputs(): string[] | undefined {
		return this.inputs;
	}

	getOutputs(): string[] | undefined {
		return this.outputs;
	}

	getSuccessor(): string | undefined {
		return this.successor;
	}

	hasAttribute(attributeName: string): boolean {
		return this.hasInput(attributeName) || this.hasOutput(attributeName);
	}

	hasInput(inputName: string): boolean {
		return this.inputs?.includes(inputName) || false;
	}

	hasOutput(outputName: string): boolean {
		return this.outputs?.includes(outputName) || false;
	}

	hasSuccessor(successor: string): boolean {
		return this.successor == successor;
	}

}

export class DirectiveRegistry {

	/**
	 * store options info about directives
	 */
	private directives = new Map<string, DirectiveNodeInfo>();

	/**
	 * register a directive with a name,
	 * 
	 * the directive could be a structural directive or an attribute directive.
	 * 
	 * if the directive name exists, will not replace the old directive options.
	 * @param directiveName 
	 * @param options contain the attributes of the registered directive name
	 * @override
	 */
	register(directiveName: string, options?: DirectiveNodeOptions): void {
		if (!this.directives.has(directiveName)) {
			const info = new DirectiveNodeInfo(options?.inputs, options?.outputs, options?.successor);
			this.directives.set(directiveName, info);
		}
	}

	/**
	 * update registry with a new value of directive
	 * @param directiveName 
	 * @param options 
	 */

	update(directiveName: string, options?: DirectiveNodeOptions): void {
		const info = new DirectiveNodeInfo(options?.inputs, options?.outputs, options?.successor);
		this.directives.set(directiveName, info);
	}

	/**
	 * replace the current options with a new one.
	 * 
	 * the directive could be a structural directive or an attribute directive.
	 * 
	 * if the directive name not exists, no set options will be done
	 * @param directiveName 
	 * @param options to be replaced
	 */
	replace(directiveName: string, options: DirectiveNodeOptions): void {
		if (this.directives.has(directiveName)) {
			const info = new DirectiveNodeInfo(options?.inputs, options?.outputs);
			this.directives.set(directiveName, info);
		}
	}

	/**
	 * check if directive name is registered
	 * @param directiveName 
	 * @returns `boolean`
	 */
	has(attributeName: string): boolean {
		return this.directives.has(attributeName);
	}

	/**
	 * get the DirectiveOptions for a directive name
	 * @param directiveName 
	 * @returns `DirectiveOptions` if the name has been registered, otherwise `undefined`
	 */
	get(directiveName: string): DirectiveNodeInfo | undefined {
		return this.directives.get(directiveName);
	}

	/**
	 * check if the options registered with a `directiveName` has attributes array
	 * @param directiveName 
	 * @returns `boolean`
	 */
	hasAttributes(directiveName: string): boolean {
		return this.hasInputs(directiveName) || this.hasOutputs(directiveName);
	}

	hasInputs(directiveName: string): boolean {
		return this.directives.get(directiveName)?.hasInputs() || false;
	}

	hasOutputs(directiveName: string): boolean {
		return this.directives.get(directiveName)?.hasOutputs() || false;
	}

	hasSuccessors(directiveName: string): boolean {
		return this.directives.get(directiveName)?.hasSuccessors() || false;
	}

	/**
	 * get the value of the registered inputs and outputs by directive name
	 * @param directiveName 
	 * @returns array of strings if found, otherwise `undefined`
	 */
	getAttributes(directiveName: string): string[] | undefined {
		return this.directives.get(directiveName)?.getAttributes();
	}

	/**
	 * get the value of the registered inputs by directive name
	 * @param directiveName 
	 * @returns array of strings if found, otherwise `undefined`
	 */
	getInputs(directiveName: string): string[] | undefined {
		return this.directives.get(directiveName)?.getInputs();
	}

	/**
	 * get the value of the registered outputs by directive name
	 * @param directiveName 
	 * @returns array of strings if found, otherwise `undefined`
	 */
	getOutputs(directiveName: string): string[] | undefined {
		return this.directives.get(directiveName)?.getOutputs();
	}

	/**
	 * get the value of the registered successors by directive name
	 * @param directiveName 
	 * @returns 
	 */
	getSuccessor(directiveName: string): string | undefined {
		return this.directives.get(directiveName)?.getSuccessor();
	}

	/**
	 * check if a directive has a attribute
	 * @param directiveName 
	 * @param attributeName 
	 * @returns 
	 */
	hasAttribute(directiveName: string, attributeName: string): boolean {
		return this.directives.get(directiveName)?.hasAttribute(attributeName) || false;
	}

	/**
	 * check if has input
	 * @param directiveName 
	 * @param inputName 
	 * @returns 
	 */
	hasInput(directiveName: string, inputName: string): boolean {
		return this.directives.get(directiveName)?.hasInput(inputName) || false;
	}

	/**
	 * check if has successor
	 * @param directiveName 
	 * @param successorName 
	 * @returns 
	 */
	hasSuccessor(directiveName: string, successorName: string): boolean {
		return this.directives.get(directiveName)?.hasSuccessor(successorName) || false;
	}

	/**
	 * check if has output
	 * @param directiveName 
	 * @param outputName 
	 * @returns 
	 */
	hasOutput(directiveName: string, outputName: string): boolean {
		return this.directives.get(directiveName)?.hasOutput(outputName) || false;
	}

	filterDirectives(attributes: string[]): string[] {
		return attributes.filter(name => this.has(name));
	}

}

export const directiveRegistry = new DirectiveRegistry();
