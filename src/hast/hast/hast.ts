export interface Point {
	/**
	 * number >= 1
	 */
	line: number;
	/**
	 * number >= 1
	 */
	column: number;
	/**
	 * number >= 0
	 */
	offset?: number;
}

export interface Position {
	start: Point;
	end: Point;

	/**
	 * number >= 1
	 */
	indent?: number;
}

export interface Data {

}

export interface Node {
	type: string;
	data?: Data;
	position?: Position;
}

/**
 * Literal represents a node in hast containing a value.
 */
export interface Literal extends Node {
	value: string;
}


/**
 * Parent represents a node in hast containing other nodes (said to be children).
 * Its content is limited to only other hast content.
 */

export interface Parent extends Node {
	children: (Element | Doctype | Comment | Text)[];
}

/**
 * ESExpression represents type of the parsed javascript code as `ExpressionNode` from `@ibyar/expression`
 */
export interface ESExpression {

}

/**
 * BoundExpression represents
 */
export interface BoundExpression {

	/**
	 * one/two way binding
	 */
	expression: ESExpression;

	/**
	 * in case of ine way, extract the pipeline names if found any
	 */
	pipelines?: string[];
}

export type PropertyName = string;
export type PropertyValue<T = any> = T;
/**
 * Properties represents information associated with an element.
 * Every field must be a PropertyName and every value a PropertyValue.
 */
export interface Properties {
	[key: PropertyName]: PropertyValue<string>;
}


export type AttributeName = string;
export type AttributeValue<T = any> = T;
/**
 * Attributes represents information associated with an element.
 * Every field must be a AttributeName and every value a AttributeValue.
 */
export interface Attributes {
	[key: AttributeName]: AttributeValue;
}

/**
 * BoundAttributes represents parsed attribute Information
 * the name, value and the parsed expression.
 */
export interface BoundAttributes {
	[key: AttributeName]: AttributeValue & BoundExpression;
}


/**
 * Doctype (Node) represents a DocumentType ([DOM]).
 * 
 * For example, the following HTML:
 * ```html
 * <!doctype html>
 * ```
 * 
 * Yields:
 * 
 * ```js
 * {type: 'doctype'}
 * ```
 */
export interface Doctype extends Node {
	type: 'doctype'
}

/**
 * Comment(Literal) represents a Comment([DOM]).
 * 
 * For example, the following HTML:
 * ```html
 * <!--Charlie-->
 * ```
 * 
 * Yields:
 * 
 * ```js
 * { type: 'comment', value: 'Charlie' }
 * ```
 */
export interface Comment extends Literal {
	type: 'comment'
}

/**
 * Text(Literal) represents a Text([DOM]).
 * 
 * For example, the following HTML:
 * ```html
 * <span>Foxtrot</span>
 * ```
 * 
 * Yields:
 * 
 * ```js
 * {
 * 		type: 'element',
 * 		tagName: 'span',
 * 		properties: { },
 * 		children: [{ type: 'text', value: 'Foxtrot' }]
 * }
 * ```
 */
export interface Text extends Literal, BoundExpression {
	type: 'text' | 'bound-text';
}


/**
 * Root (Parent) represents a document.
 * 
 * Root can be used as the root of a tree, or as a value of the content field on a 'template' Element, never as a child.
 */
export interface Root extends Parent {
	type: 'root'
}

/**
 * Element(Parent) represents an Element([DOM]).
 * 
 * If the tagName field is 'template', a content field can be present. The value of the content field implements the Root interface.
 * If the tagName field is 'template', the element must be a leaf.
 * If the tagName field is 'noscript', its children should be represented as if scripting is disabled ([HTML]).
 */
export interface Element extends Parent {
	type: 'element';

	/**
	 * A tagName field must be present. It represents the element’s local name ([DOM]).
	 */
	tagName: string;

	/**
	 * The properties field represents information associated with the element.
	 * The value of the properties field implements the Properties interface.
	 */
	properties?: Properties;

	/**
	 * The attributes field represents information associated with the element.
	 * The value of the attributes field implements the Attributes interface.
	 */
	attributes?: Attributes;
	content?: Root;
	children: [Element | Comment | Text];

	inputs?: BoundAttributes[];
	outputs?: BoundAttributes[];

}
