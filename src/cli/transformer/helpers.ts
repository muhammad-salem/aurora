import ts from 'typescript/lib/tsserverlibrary.js';


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

