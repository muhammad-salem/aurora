import ts from 'typescript/lib/tsserverlibrary.js';
import { DecoratorInfo } from './modules.js';


/**
 * check if a decorator is a `@Component` decorator;
 * @param decorator 
 * @param expressionName 
 * @returns 
 */
export function isComponentDecorator(decorator: ts.Decorator, componentName = 'Component'): boolean {
	return ts.isCallExpression(decorator.expression) && decorator.expression.expression.getText() === componentName;
};


/**
 * check if a decorator is a `@Directive` decorator;
 * @param decorator 
 * @param directiveName 
 * @returns 
 */
export function isDirectiveDecorator(decorator: ts.Decorator, directiveName = 'Directive'): boolean {
	return ts.isCallExpression(decorator.expression) && decorator.expression.expression.getText() === directiveName;
};

export function isComponentOrDirectiveDecorator(decorator: ts.Decorator, componentName = 'Component', directiveName = 'Directive'): boolean {
	return isComponentDecorator(decorator, componentName) || isDirectiveDecorator(decorator, directiveName);
};


/**
 * check if a decorator is a `@Pipe` decorator;
 * @param decorator 
 * @param pipeName 
 * @returns 
 */
export function isPipeDecorator(decorator: ts.Decorator, pipeName = 'Pipe'): boolean {
	return ts.isCallExpression(decorator.expression) && decorator.expression.expression.getText() === pipeName;
};

/**
 * check if a decorator is a `@Injectable` decorator;
 * @param decorator 
 * @param injectableName 
 * @returns 
 */
export function isInjectableDecorator(decorator: ts.Decorator, injectableName = 'Injectable'): boolean {
	return ts.isCallExpression(decorator.expression) && decorator.expression.expression.getText() === injectableName;
};


/**
 * check if Decorator is `@Input` or `@FormValue`
 * @param decorator 
 * @returns 
 */
export function isInputDecorator(decorator: ts.Decorator): boolean {
	return ts.isCallExpression(decorator.expression) && (
		decorator.expression.expression.getText() === 'Input'
		|| decorator.expression.expression.getText() === 'FormValue'
	);
}

/**
 * check if Decorator is `@Output`
 * @param decorator 
 * @returns 
 */
export function isOutputDecorator(decorator: ts.Decorator): boolean {
	return ts.isCallExpression(decorator.expression) && decorator.expression.expression.getText() === 'Output';
}

export function getMapByDecoratorForPropertyDeclaration(member: ts.PropertyDeclaration, checker: ts.TypeChecker, decoratorFilter: ((decorator: ts.Decorator) => boolean)): DecoratorInfo[] {
	const infos: DecoratorInfo[] = [];
	const decorators = ts.getDecorators(member);
	if (!decorators) {
		return infos;
	}
	const inputDecorators = decorators.filter(decoratorFilter);
	if (!inputDecorators.length) {
		return infos;
	}
	let inputType = member.type?.getText();
	if (!inputType && member.initializer) {
		inputType = checker.typeToString(checker.getTypeAtLocation(member.initializer), member.initializer, undefined);
	}
	inputDecorators.forEach(input => {
		const decoratorCall = input.expression as ts.CallExpression;
		const aliasName = decoratorCall.arguments[0] as ts.StringLiteralLike;
		const alias = aliasName ? aliasName.text : member.name.getText();
		infos.push({ name: member.name.getText(), aliasName: alias, type: inputType });
	});
	return infos;
}

export function getMapByDecoratorForSetAccessorDeclaration(member: ts.SetAccessorDeclaration, checker: ts.TypeChecker, decoratorFilter: ((decorator: ts.Decorator) => boolean)): DecoratorInfo[] {
	const infos: DecoratorInfo[] = [];
	const decorators = ts.getDecorators(member);
	if (!decorators) {
		return infos;
	}
	const inputDecorators = decorators.filter(decoratorFilter);
	if (!inputDecorators.length) {
		return infos;
	}

	let memberName: string;
	if (ts.isIdentifier(member.name)) {
		memberName = member.name.getText();
	} else if (ts.isComputedPropertyName(member.name) && ts.isStringLiteral(member.name.expression)) {
		memberName = member.name.expression.getText();
	} else {
		return infos;
	}

	let inputType = checker.typeToString(checker.getTypeAtLocation(member.parameters[0]), member.parameters[0], undefined);
	inputDecorators.forEach(input => {
		const decoratorCall = input.expression as ts.CallExpression;
		const aliasName = decoratorCall.arguments[0] as ts.StringLiteralLike;
		const alias = aliasName ? aliasName.text : memberName;
		infos.push({ name: memberName, aliasName: alias, type: inputType });
	});
	return infos;
}

export function getMapByDecorator(classNode: ts.ClassDeclaration, checker: ts.TypeChecker, decoratorFilter: ((decorator: ts.Decorator) => boolean)): DecoratorInfo[] {
	const infos: DecoratorInfo[] = [];
	classNode.members.forEach(member => {
		if (ts.isPropertyDeclaration(member)) {
			infos.push(...getMapByDecoratorForPropertyDeclaration(member, checker, decoratorFilter));
		} else if (ts.isSetAccessorDeclaration(member)) {
			infos.push(...getMapByDecoratorForSetAccessorDeclaration(member, checker, decoratorFilter));
		}
	})
	return infos;
}

/**
 * get a component or directive inputs that is annotated by `@Input` or `@FormValue`.
 * @param classNode 
 * @param checker 
 * @returns 
 */
export function getInputs(classNode: ts.ClassDeclaration, checker: ts.TypeChecker): DecoratorInfo[] {
	return getMapByDecorator(classNode, checker, isInputDecorator);
}

/**
 * get a component or directive input names that is annotated by `@Input` or `@FormValue`.
 * @param classNode 
 * @param checker 
 * @returns 
 */
export function getInputNames(classNode: ts.ClassDeclaration, checker: ts.TypeChecker): string[] {
	return getInputs(classNode, checker).map(info => info.aliasName);
}

/**
 * get a component or directive outputs that is annotated by `@Output`.
 * @param classNode 
 * @param checker 
 * @returns 
 */
export function getOutputs(classNode: ts.ClassDeclaration, checker: ts.TypeChecker): DecoratorInfo[] {
	return getMapByDecorator(classNode, checker, isOutputDecorator);
}

/**
 * get a component or directive output names that is annotated by `@Output`.
 * @param classNode 
 * @param checker 
 * @returns 
 */
export function getOutputNames(classNode: ts.ClassDeclaration, checker: ts.TypeChecker): string[] {
	return getOutputs(classNode, checker).map(info => info.aliasName);
}

/**
 * get text value for a property in ObjectLiteralExpression
 * @param option 
 * @param property 
 * @returns 
 */
export function getTextValueForProperty(option: ts.ObjectLiteralExpression, property: string): string | undefined {
	const selectorProperty = option.properties
		.find(prop => prop.name?.getText() === property) as ts.PropertyAssignment | undefined;

	const initializer = selectorProperty?.initializer.getText();
	if (!initializer) {
		return;
	}
	return initializer?.substring(1, initializer.length - 1);
}
