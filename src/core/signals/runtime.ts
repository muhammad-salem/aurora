import {
	AssignmentExpression,
	CallExpression, ExpressionNode,
	expressionVisitor, Identifier,
	JavaScriptParser, Literal,
	MemberExpression, MethodDefinition,
	Property, PropertyDefinition,
	ThisExpression, VisitorCallback
} from '@ibyar/expressions';

type Key =
	| 'input'
	| 'output'
	| 'formValue'
	| 'view'
	| 'viewChild'
	| 'viewChildren'
	| 'signal'
	| 'computed'
	| 'lazy'
	| 'signalNode'
	| 'computedNode'
	| 'lazyNode';

type RuntimeOption = {
	name: Key,
	alias: string,
};

export type SignalRuntimeMetadata = {
	signal: Key;
	necessity?: 'required';
	options: Array<RuntimeOption>;
};

/**
 * scan model class for (inputs and output) property definitions with value by function call.
 */
export class RuntimeClassMetadata {

	static INSTANCE = new RuntimeClassMetadata();

	static scanMetadata(modelClass: Function) {
		return RuntimeClassMetadata.INSTANCE.scan(modelClass);
	}

	static scanClass(modelClass: Function, visitorCallback: VisitorCallback) {
		return RuntimeClassMetadata.INSTANCE.scanModelClass(modelClass, visitorCallback);
	}

	scan(modelClass: Function): SignalRuntimeMetadata[] {
		const metadata = this.newModelInitializers();
		const visitor = this.createVisitor(metadata);
		this.scanModelClass(modelClass, visitor);
		return metadata;
	}

	/**
	 * scan class `Function` for properties and methods definitions.
	 * @param modelClass 
	 * @param visitorCallback 
	 */
	scanModelClass(modelClass: Function, visitorCallback: VisitorCallback) {
		const script = this.getClassScript(modelClass);
		const expr = JavaScriptParser.parse(script);
		expressionVisitor.visit(expr, visitorCallback);
	}

	getClassScript(modelClass: Function): string {
		return this.getClassList(modelClass).map((ref, index) => `const Class${index} = ${ref};`).join('\n');;
	}

	getClassList(modelClass: Function): Function[] {
		const list: Function[] = [];
		while (modelClass instanceof Function) {
			list.push(modelClass);
			modelClass = Object.getPrototypeOf(modelClass);
		}
		return list.reverse();
	}

	newModelInitializers(): SignalRuntimeMetadata[] {
		return [
			{ signal: 'input', options: [] },
			{ signal: 'input', necessity: 'required', options: [] },
			{ signal: 'output', options: [] },
			{ signal: 'signal', options: [] },
			{ signal: 'computed', options: [] },
			{ signal: 'lazy', options: [] },
			{ signal: 'formValue', options: [] },
			{ signal: 'formValue', necessity: 'required', options: [] },
			{ signal: 'view', options: [] },
			{ signal: 'viewChild', options: [] },
			{ signal: 'viewChild', necessity: 'required', options: [] },
			{ signal: 'viewChildren', options: [] },
			{ signal: 'signalNode', options: [] },
			{ signal: 'computedNode', options: [] },
			{ signal: 'lazyNode', options: [] },
		];
	}

	createVisitor(properties: SignalRuntimeMetadata[]): VisitorCallback {
		return (expression, type) => {
			if (type === 'PropertyDefinition') {
				const definition = expression as PropertyDefinition;
				const key = definition.getKey();
				const value = definition.getValue();
				if (definition.isPrivate()
					|| definition.isStatic()
					|| !(key instanceof Identifier || key instanceof Literal)
					|| !(value instanceof CallExpression)) {
					return;
				}
				const property = properties.find(property => this.isCallOf(value, property.signal, property.necessity));
				if (property) {
					const name = key instanceof Identifier ? key.getName() : key.getValue();
					const alias = this.getAliasNameFromOptionArgument(value);
					property.options.push({ name, alias: alias ?? name });
				}
			} else if (type === 'MethodDefinition') {
				const definition = expression as MethodDefinition;
				if (definition.getKind() !== 'constructor') {
					return;
				}
				expressionVisitor.visit(definition.getValue(), (exp, expType) => {
					if (expType === 'AssignmentExpression') {
						const assignment = exp as AssignmentExpression;
						const right = assignment.getRight();
						if (right instanceof CallExpression) {
							const property = properties.find(property => this.isCallOf(right, property.signal, property.necessity));
							if (!property) {
								return;
							}
							const name = this.hasMemberOfThis(assignment.getLeft());
							if (name) {
								const alias = this.getAliasNameFromOptionArgument(right);
								property.options.push({ name, alias: alias ?? name });
							}
						}
					}
				});
			}
		};
	}

	getAliasNameFromOptionArgument(call: CallExpression): string | undefined {
		let alias: string | undefined;
		call.getArguments()?.forEach(argument => expressionVisitor.visit(argument, (exp, type, control) => {
			if (exp instanceof Property) {
				if (this.isProperty(exp.getKey(), 'alias')) {
					const value = exp.getValue();
					if (value instanceof Literal) {
						alias = value.getValue();
						control.abort();
					}
				}
			}
		}));
		return alias;
	}

	isProperty(node: ExpressionNode, property: string): boolean {
		return (node instanceof Identifier && node.getName() === property)
			|| (node instanceof Literal && node.getValue() === property);
	}

	isCallOf(call: CallExpression, objectName: string, propertyName?: string): boolean {
		const callee = call.getCallee();
		if (propertyName && callee instanceof MemberExpression) {
			return this.isMemberOf(callee, objectName, propertyName);
		} else if (!propertyName && callee instanceof Identifier && callee.getName() === objectName) {
			return true;
		}
		return false;
	}

	isMemberOf(member: MemberExpression, objectName: string, propertyName: string): boolean {
		const object = member.getObject();
		const property = member.getProperty();
		if (object instanceof Identifier && object.getName() === objectName) {
			if (property instanceof Identifier && property.getName() === propertyName) {
				return true;
			} else if (property instanceof Literal && property.getValue() === propertyName) {
				return true;
			}
			return true;
		}
		return false;
	}

	hasMemberOfThis(member: ExpressionNode): Key | false {
		if (!(member instanceof MemberExpression)) {
			return false;
		}
		const object = member.getObject();
		const property = member.getProperty();
		if (object instanceof ThisExpression) {
			if (property instanceof Identifier) {
				return property.getName() as Key;
			} else if (property instanceof Literal) {
				return property.getValue() as Key;
			}
		}
		return false;
	}

}

