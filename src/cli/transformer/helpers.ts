import ts from 'typescript/lib/tsserverlibrary.js';
import { InputOutputTypeInfo } from './modules.js';


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

export function getMapByDecorator(classNode: ts.ClassDeclaration, checker: ts.TypeChecker, decoratorFilter: ((decorator: ts.Decorator) => boolean)): InputOutputTypeInfo {
	const map: InputOutputTypeInfo = {};
	classNode.members.forEach(member => {
		if (!ts.isPropertyDeclaration(member)) {
			return;
		}
		const decorators = ts.getDecorators(member);
		if (!decorators) {
			return;
		}
		const inputDecorators = decorators.filter(decoratorFilter);
		if (!inputDecorators.length) {
			return;
		}
		let inputType = member.type?.getText();
		if (!inputType && member.initializer) {
			inputType = checker.typeToString(checker.getTypeAtLocation(member.initializer), member.initializer, undefined);
		}
		inputDecorators.forEach(input => {
			const decoratorCall = input.expression as ts.CallExpression;
			const aliasName = decoratorCall.arguments[0] as ts.StringLiteralLike;
			const inputName = aliasName ? aliasName.text : member.name.getText();
			map[inputName] = inputType;
		});
	})
	return map;
}

/**
 * get a component or directive inputs that is annotated by `@Input` or `@FormValue`.
 * @param classNode 
 * @param checker 
 * @returns 
 */
export function getInputs(classNode: ts.ClassDeclaration, checker: ts.TypeChecker): InputOutputTypeInfo {
	return getMapByDecorator(classNode, checker, isInputDecorator);
}

/**
 * get a component or directive input names that is annotated by `@Input` or `@FormValue`.
 * @param classNode 
 * @param checker 
 * @returns 
 */
export function getInputNames(classNode: ts.ClassDeclaration, checker: ts.TypeChecker): string[] {
	return Object.keys(getMapByDecorator(classNode, checker, isInputDecorator));
}

/**
 * get a component or directive outputs that is annotated by `@Output`.
 * @param classNode 
 * @param checker 
 * @returns 
 */
export function getOutputs(classNode: ts.ClassDeclaration, checker: ts.TypeChecker): InputOutputTypeInfo {
	return getMapByDecorator(classNode, checker, isOutputDecorator);
}

/**
 * get a component or directive output names that is annotated by `@Output`.
 * @param classNode 
 * @param checker 
 * @returns 
 */
export function getOutputNames(classNode: ts.ClassDeclaration, checker: ts.TypeChecker): string[] {
	return Object.keys(getMapByDecorator(classNode, checker, isOutputDecorator));
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
