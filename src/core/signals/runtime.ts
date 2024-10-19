import {
	CallExpression, ExpressionNode,
	PropertyDefinition, expressionVisitor,
	Identifier, MemberExpression, Literal,
	MethodDefinition, AssignmentExpression,
	ThisExpression, JavaScriptParser
} from '@ibyar/expressions';

/**
 * scan model class for (inputs and output) property definitions with value by function call.
 */
export class RuntimeClassMetadata {

	static INSTANCE = new RuntimeClassMetadata();

	static scanInputs(modelClass: Function) {
		return RuntimeClassMetadata.INSTANCE.getInputs(modelClass);
	}

	static scanOutputs(modelClass: Function) {
		return RuntimeClassMetadata.INSTANCE.getOutputs(modelClass);
	}

	static scanInputsOutputs(modelClass: Function) {
		return RuntimeClassMetadata.INSTANCE.getInputsOutputs(modelClass);
	}


	getInputs(modelClass: Function): string[] {
		const script = this.getClassScript(modelClass);
		const expr = JavaScriptParser.parse(script);
		return this.scanPropertyInitializer(expr, 'input', 'required');
	}

	getOutputs(modelClass: Function): string[] {
		const script = this.getClassScript(modelClass);
		const expr = JavaScriptParser.parse(script);
		return this.scanPropertyInitializer(expr, 'output');
	}

	getInputsOutputs(modelClass: Function): { inputs: string[], outputs: string[] } {
		const script = this.getClassScript(modelClass);
		const expr = JavaScriptParser.parse(script);
		const inputs = this.scanPropertyInitializer(expr, 'input', 'required');
		const outputs = this.scanPropertyInitializer(expr, 'output');
		return { inputs, outputs };
	}

	getClassScript(modelClass: Function): string {
		return this.getClassList(modelClass).map((ref, index) => `const class${index} = ${ref};`).join('\n');;
	}

	getClassList(modelClass: Function): Function[] {
		const list: Function[] = [];
		while (modelClass instanceof Function) {
			list.push(modelClass);
			modelClass = Object.getPrototypeOf(modelClass);
		}
		return list.reverse();
	}

	scanPropertyInitializer(modelExpression: ExpressionNode, objectName: string, propertyName?: string): string[] {
		const inputs: string[] = [];
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
				if (this.isCallOf(value, objectName, propertyName)) {
					inputs.push(key instanceof Identifier ? key.getName() : key.getValue());
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
						if (right instanceof CallExpression && this.isCallOf(right, objectName, propertyName)) {
							const name = this.hasMemberOfThis(assignment.getLeft());
							name && inputs.push(name);
						}
					}
				});
			}
		});
		return inputs;
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

