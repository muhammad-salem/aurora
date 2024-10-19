import {
	CallExpression, ExpressionNode,
	PropertyDefinition, expressionVisitor,
	Identifier, MemberExpression, Literal,
	MethodDefinition, AssignmentExpression,
	ThisExpression, JavaScriptParser
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

type PropertyDetail = { objectName: Key, propertyName?: string, list: string[] };

/**
 * scan model class for (inputs and output) property definitions with value by function call.
 */
export class RuntimeClassMetadata {

	static INSTANCE = new RuntimeClassMetadata();

	static scanInitializers(modelClass: Function) {
		return RuntimeClassMetadata.INSTANCE.scan(modelClass);
	}

	scan(modelClass: Function): Record<Key, string[]> {
		const script = this.getClassScript(modelClass);
		const expr = JavaScriptParser.parse(script);
		const properties = this.newModelInitializers();
		this.scanPropertyInitializers(expr, properties);
		return Object.fromEntries(properties.map(property => ([property.propertyName, property.list]))) as Record<Key, string[]>;
	}

	getClassScript(modelClass: Function): string {
		return this.getClassList(modelClass).map((ref, index) => `const Class${index} = ${ref};`).join('\n');;
	}

	newModelInitializers(): PropertyDetail[] {
		return [
			{ objectName: 'input', propertyName: 'required', list: [] },
			{ objectName: 'output', list: [] },
			{ objectName: 'signal', list: [] },
			{ objectName: 'computed', list: [] },
			{ objectName: 'lazy', list: [] },
			{ objectName: 'formValue', list: [] },
			{ objectName: 'view', list: [] },
			{ objectName: 'viewChild', propertyName: 'required', list: [] },
			{ objectName: 'viewChildren', list: [] },
			{ objectName: 'signalNode', list: [] },
			{ objectName: 'computedNode', list: [] },
			{ objectName: 'lazyNode', list: [] },
		];
	}

	getClassList(modelClass: Function): Function[] {
		const list: Function[] = [];
		while (modelClass instanceof Function) {
			list.push(modelClass);
			modelClass = Object.getPrototypeOf(modelClass);
		}
		return list.reverse();
	}

	scanPropertyInitializers(modelExpression: ExpressionNode, properties: PropertyDetail[]): void {
		expressionVisitor.visit(modelExpression, (expression, type) => {
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
				const property = properties.find(property => this.isCallOf(value, property.objectName, property.propertyName));
				property?.list.push(key instanceof Identifier ? key.getName() : key.getValue());
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
							const property = properties.find(property => this.isCallOf(right, property.objectName, property.propertyName));
							if (!property) {
								return;
							}
							const name = this.hasMemberOfThis(assignment.getLeft());
							name && property.list.push(name);
						}
					}
				});
			}
		});
	}

	isCallOf(call: CallExpression, objectName: string, propertyName?: string): boolean {
		const callee = call.getCallee();
		if (callee instanceof Identifier && callee.getName() === objectName) {
			return true;
		} else if (propertyName && callee instanceof CallExpression && callee.getCallee() instanceof MemberExpression) {
			return this.isMemberOf(callee.getCallee() as MemberExpression, objectName, propertyName);
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

	hasMemberOfThis(member: ExpressionNode): string | false {
		if (!(member instanceof MemberExpression)) {
			return false;
		}
		const object = member.getObject();
		const property = member.getProperty();
		if (object instanceof ThisExpression) {
			if (property instanceof Identifier) {
				return property.getName() as string;
			} else if (property instanceof Literal) {
				return property.getValue();
			}
		}
		return false;
	}

}

