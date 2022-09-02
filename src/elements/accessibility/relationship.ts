
/**
 * element id attribute
 */
export type ElementID = string;
export type AriaActiveDescendantElement = ElementID;

export type AriaActiveDescendantElementRole =
	| 'application'
	| 'combobox'
	| 'composite'
	| 'group'
	| 'textbox';


export type AriaColCount = number;
export type AriaColCountRole = 'table' | 'grid' | 'treegrid';

export type AriaColIndex = number;

export type AriaColIndexRole =
	| 'cell'
	| 'row'
	| 'columnheader'
	| 'gridcell'
	| 'rowheader';


export type AriaColSpan = number;
export type AriaColSpanRole = 'cell' | 'columnheader' | 'rowheader';


export type AriaControlsElements = ElementID | ElementID[];;

export type AriaDescribedByElements = ElementID | ElementID[];;

export type AriaDetailsElements = ElementID | ElementID[];;


export type AriaDescription = string;

export type AriaErrorMessageElement = ElementID;
export type AriaErrorMessageElementRole =
	| 'application'
	| 'checkbox'
	| 'combobox'
	| 'gridcell'
	| 'listbox'
	| 'radiogroup'
	| 'slider'
	| 'spinbutton'
	| 'textbox'
	| 'tree'
	| 'columnheader'
	| 'rowheader'
	| 'searchbox'
	| 'switch'
	| 'treegrid';

export type AriaFlowToElements = ElementID | ElementID[];
export type AriaLabelledByElements = ElementID | ElementID[];
export type AriaOwnsElements = ElementID | ElementID[];
export type AriaPosInSet = number;

/**
 * The number of rows in the full table or -1 is the table size is not known.
 */
export type AriaRowCount = number;

/**
 * An integer greater than or equal to 1, greater than the aria-rowindex of the previous row, if any, and less than or equal to the value of aria-rowcount.
 */
export type AriaRowIndex = number;

/**
 * An integer greater than or equal to 0 and less than would cause a cell to overlap the next cell in the same column.
 */
export type AriaRowSpan = number;

/**
 * The number of items in the full set or -1 is the set size is unknown.
 */
export type AriaSetSize = number;

export interface RelationshipModel {
	ariaActiveDescendantElement: AriaActiveDescendantElement,
	ariaColCount: AriaColCount,
	ariaColIndex: AriaColIndex,
	ariaColSpan: AriaColSpan,
	ariaControlsElements: AriaControlsElements,
	ariaDescribedByElements: AriaDescribedByElements,
	ariaDescription: AriaDescription,
	ariaDetailsElements: AriaDetailsElements,
	ariaErrorMessageElement: AriaErrorMessageElement,
	ariaFlowToElements: AriaFlowToElements,
	ariaLabelledByElements: AriaLabelledByElements
	ariaOwnsElements: AriaOwnsElements,
	ariaPosInSet: AriaPosInSet,
	ariaRowCount: AriaRowCount,
	ariaRowIndex: AriaRowIndex,
	ariaRowSpan: AriaRowSpan,
	ariaSetSize: AriaSetSize,
}

export const RelationshipAttributes = [
	'aria-activedescendant',
	'aria-colcount',
	'aria-colindex',
	'aria-colspan',
	'aria-controls',
	'aria-describedby',
	'aria-description',
	'aria-details',
	'aria-errormessage',
	'aria-flowto',
	'aria-labelledby',
	'aria-owns',
	'aria-posinset',
	'aria-rowcount',
	'aria-rowindex',
	'aria-rowspan',
	'aria-setsize',
];

export const RelationshipAttributesMap = {
	'aria-activedescendant': 'ariaActiveDescendantElement',
	'aria-colcount': 'ariaColCount',
	'aria-colindex': 'ariaColIndex',
	'aria-colspan': 'ariaColSpan',
	'aria-controls': 'ariaControlsElements',
	'aria-describedby': 'ariaDescribedByElements',
	'aria-description': 'ariaDescription',
	'aria-details': 'ariaDetailsElements',
	'aria-errormessage': 'ariaErrorMessageElement',
	'aria-flowto': 'ariaFlowToElements',
	'aria-labelledby': 'ariaLabelledByElements',
	'aria-owns': 'ariaOwnsElements',
	'aria-posinset': 'ariaPosInSet',
	'aria-rowcount': 'ariaRowCount',
	'aria-rowindex': 'ariaRowIndex',
	'aria-rowspan': 'ariaRowSpan',
	'aria-setsize': 'ariaSetSize',
};
