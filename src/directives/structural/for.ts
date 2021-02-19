import { Directive, OnInit, StructuralDirective } from '@ibyar/api';
import {
	AliasedOperator, ArrayOperator, AssignmentNode, DeclareVariableOperator,
	generateTokenParser, generateTokens, GroupingOperator, MemberNode,
	NavigationNode, NodeExpression, ObjectOperator, OfItemsOperator,
	parseTokens, PipelineOperator, StatementNode, TernaryNode
} from '@ibyar/expression';


const tokenParser = generateTokenParser([
	MemberNode.Operators,
	NavigationNode.Operators,
	GroupingOperator.Operators,
	ObjectOperator.Operators,
	ArrayOperator.Operators,
	PipelineOperator.Operators,
	TernaryNode.Operators,
	AssignmentNode.Operators,
	StatementNode.Operators,
	DeclareVariableOperator.Operators,
	AliasedOperator.Operators,
	OfItemsOperator.Operators
], []);

let str = 'const item of items; index as i; first as isFirst';
let tokens: (NodeExpression | string)[] = generateTokens(str, tokenParser);
console.log(tokens);

let jsTokens = parseTokens(tokens);
console.log(jsTokens);

interface ForDefinition {
	itemName: string;
	itemsName: string;
}

interface ItemContext {
	// [key: string]: number | boolean;
	/** The ref name of the current item in the iterable. */
	name: string;
	/** The index of the current item in the iterable. */
	index: number;
	/** The length of the iterable. */
	count: number;
	/**  True when the item is the first item in the iterable. */
	first: boolean;
	/** True when the item is the last item in the iterable. */
	last: boolean;
	/** True when the item has an even index in the iterable. */
	even: boolean;
	/** True when the item has an odd index in the iterable. */
	odd: boolean;
}

@Directive({
	selector: '*for',
})
export class ForDirective<T> extends StructuralDirective<T> implements OnInit {

	lastElement: HTMLElement | Comment;

	onInit(): void {
		console.log(`${this.directive.directiveName}="${this.directive.directiveValue}"`);

		// this.lastElement = this.comment;

		// // hard coded example 'let person of people'

		// let arrayExpression = parseJSExpression('people');

		// let array = arrayExpression.get(this.render.view._model) as any[];
		// for (const item of array) {
		//     const additionalSources: PropertySource[] = [{
		//         property: 'person',
		//         src: item
		//     }];
		//     const element = this.render.createElement(this.directive.children[0] as ElementNode, additionalSources);
		//     this.lastElement.after(element);
		//     this.lastElement = element;
		// }
	}

}
