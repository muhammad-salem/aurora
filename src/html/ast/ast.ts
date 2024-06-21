

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
	 * number >= 0?
	 */
	offset: number;
}

export interface Position {
	start: Point;
	end: Point;
}

export interface Data {

}

export interface Node {
	type: string;
	data?: Data;
	position?: Position;
}


export interface Literal extends Node {
	value: string;
}


export interface Parent extends Node {
	children: (Comment | Doctype | Element | Text)[]
}


/**
 * For example, the following HTML:
 * ```html
 * <!--Charlie-->
 * ```
 * ```
 * 
 * Yields:
 * 
 * ```json
 * {type: 'comment', value: 'Charlie'}
 * ```
 */
export interface Comment extends Literal {
	type: 'comment';
}

/**
 * For example, the following HTML:
 * ```html
 * <!doctype html>
 * ```
 * ```
 * 
 * Yields:
 * 
 * ```json
 * {type: 'doctype'}
 * ```
 */
export interface Doctype extends Node {
	type: 'doctype';
}


/**
 * For example, the following HTML:
 * ```html
 * <a href="https://alpha.com" class="bravo" download></a>
 * ```
 * ```
 * 
 * Yields:
 * 
 * ```json
 * {
 *   type: 'element',
 *   tagName: 'a',
 *   properties: {
 *     href: 'https://alpha.com',
 *     className: ['bravo'],
 *     download: true
 *   },
 *   children: []
 * }
 * ```
 */
export interface Element extends Parent {
	type: 'element';
	tagName: string;
	properties?: Properties;
	content?: Root;
	children: (Comment | Element | Text)[]
}


export interface Root extends Parent {
	type: 'root';
}

/**
 * For example, the following HTML:
 * ```html
 * <span>Foxtrot</span>
 * ```
 * 
 * Yields:
 * 
 * ```json
 * {
 * 	type: 'element',
 * 	tagName: 'span',
 * 	properties: {},
 * 	children: [{type: 'text', value: 'Foxtrot'}]
 * }
 * ```
 */
export interface Text extends Literal {
	type: 'text';
}

export type PropertyName = string;

export type PropertyValue = any;

export interface Properties {
	[key: PropertyName]: PropertyValue;
}

