import {
	ElementNode, DirectiveNode, FragmentNode,
	CommentNode, TextNode, LiveText
} from '../node/nodes.js';

export type AuroraElement =
	ElementNode | DirectiveNode | FragmentNode |
	CommentNode | TextNode | LiveText;

export type EventMap<T> = Function | string | ((this: Window, ev: T) => any) | null;
export type AttrMap<T> = T & { [key: string]: any };

export interface DOMAttributes {
	children?: AuroraElement[];
	dangerouslySetInnerHTML?: {
		__html: string;
	};

	// Clipboard Events
	onCopy?: EventMap<ClipboardEvent>;
	onCopyCapture?: EventMap<ClipboardEvent>;
	onCut?: EventMap<ClipboardEvent>;
	onCutCapture?: EventMap<ClipboardEvent>;
	onPaste?: EventMap<ClipboardEvent>;
	onPasteCapture?: EventMap<ClipboardEvent>;

	// Composition Events
	onCompositionEnd?: EventMap<CompositionEvent>;
	onCompositionEndCapture?: EventMap<CompositionEvent>;
	onCompositionStart?: EventMap<CompositionEvent>;
	onCompositionStartCapture?: EventMap<CompositionEvent>;
	onCompositionUpdate?: EventMap<CompositionEvent>;
	onCompositionUpdateCapture?: EventMap<CompositionEvent>;

	// Focus Events
	onFocus?: EventMap<FocusEvent>;
	onFocusCapture?: EventMap<FocusEvent>;
	onBlur?: EventMap<FocusEvent>;
	onBlurCapture?: EventMap<FocusEvent>;

	// Form Events
	onChange?: EventMap<Event>;
	onChangeCapture?: EventMap<Event>;
	onBeforeInput?: EventMap<Event>;
	onBeforeInputCapture?: EventMap<Event>;
	onInput?: EventMap<Event>;
	onInputCapture?: EventMap<Event>;
	onReset?: EventMap<Event>;
	onResetCapture?: EventMap<Event>;
	onSubmit?: EventMap<Event>;
	onSubmitCapture?: EventMap<Event>;
	onInvalid?: EventMap<Event>;
	onInvalidCapture?: EventMap<Event>;

	// Image Events
	onLoad?: EventMap<Event>;
	onLoadCapture?: EventMap<Event>;
	onError?: EventMap<Event>; // also a Media Event
	onErrorCapture?: EventMap<Event>; // also a Media Event

	// Keyboard Events
	onKeyDown?: EventMap<KeyboardEvent>;
	onKeyDownCapture?: EventMap<KeyboardEvent>;
	onKeyPress?: EventMap<KeyboardEvent>;
	onKeyPressCapture?: EventMap<KeyboardEvent>;
	onKeyUp?: EventMap<KeyboardEvent>;
	onKeyUpCapture?: EventMap<KeyboardEvent>;

	// Media Events
	onAbort?: EventMap<Event>;
	onAbortCapture?: EventMap<Event>;
	onCanPlay?: EventMap<Event>;
	onCanPlayCapture?: EventMap<Event>;
	onCanPlayThrough?: EventMap<Event>;
	onCanPlayThroughCapture?: EventMap<Event>;
	onDurationChange?: EventMap<Event>;
	onDurationChangeCapture?: EventMap<Event>;
	onEmptied?: EventMap<Event>;
	onEmptiedCapture?: EventMap<Event>;
	onEncrypted?: EventMap<Event>;
	onEncryptedCapture?: EventMap<Event>;
	onEnded?: EventMap<Event>;
	onEndedCapture?: EventMap<Event>;
	onLoadedData?: EventMap<Event>;
	onLoadedDataCapture?: EventMap<Event>;
	onLoadedMetadata?: EventMap<Event>;
	onLoadedMetadataCapture?: EventMap<Event>;
	onLoadStart?: EventMap<Event>;
	onLoadStartCapture?: EventMap<Event>;
	onPause?: EventMap<Event>;
	onPauseCapture?: EventMap<Event>;
	onPlay?: EventMap<Event>;
	onPlayCapture?: EventMap<Event>;
	onPlaying?: EventMap<Event>;
	onPlayingCapture?: EventMap<Event>;
	onProgress?: EventMap<Event>;
	onProgressCapture?: EventMap<Event>;
	onRateChange?: EventMap<Event>;
	onRateChangeCapture?: EventMap<Event>;
	onSeeked?: EventMap<Event>;
	onSeekedCapture?: EventMap<Event>;
	onSeeking?: EventMap<Event>;
	onSeekingCapture?: EventMap<Event>;
	onStalled?: EventMap<Event>;
	onStalledCapture?: EventMap<Event>;
	onSuspend?: EventMap<Event>;
	onSuspendCapture?: EventMap<Event>;
	onTimeUpdate?: EventMap<Event>;
	onTimeUpdateCapture?: EventMap<Event>;
	onVolumeChange?: EventMap<Event>;
	onVolumeChangeCapture?: EventMap<Event>;
	onWaiting?: EventMap<Event>;
	onWaitingCapture?: EventMap<Event>;

	// MouseEvents
	onAuxClick?: EventMap<MouseEvent>;
	onAuxClickCapture?: EventMap<MouseEvent>;
	onClick?: EventMap<MouseEvent>;
	onClickCapture?: EventMap<MouseEvent>;
	onContextMenu?: EventMap<MouseEvent>;
	onContextMenuCapture?: EventMap<MouseEvent>;
	onDoubleClick?: EventMap<MouseEvent>;
	onDoubleClickCapture?: EventMap<MouseEvent>;
	onDrag?: EventMap<DragEvent>;
	onDragCapture?: EventMap<DragEvent>;
	onDragEnd?: EventMap<DragEvent>;
	onDragEndCapture?: EventMap<DragEvent>;
	onDragEnter?: EventMap<DragEvent>;
	onDragEnterCapture?: EventMap<DragEvent>;
	onDragExit?: EventMap<DragEvent>;
	onDragExitCapture?: EventMap<DragEvent>;
	onDragLeave?: EventMap<DragEvent>;
	onDragLeaveCapture?: EventMap<DragEvent>;
	onDragOver?: EventMap<DragEvent>;
	onDragOverCapture?: EventMap<DragEvent>;
	onDragStart?: EventMap<DragEvent>;
	onDragStartCapture?: EventMap<DragEvent>;
	onDrop?: EventMap<DragEvent>;
	onDropCapture?: EventMap<DragEvent>;
	onMouseDown?: EventMap<MouseEvent>;
	onMouseDownCapture?: EventMap<MouseEvent>;
	onMouseEnter?: EventMap<MouseEvent>;
	onMouseLeave?: EventMap<MouseEvent>;
	onMouseMove?: EventMap<MouseEvent>;
	onMouseMoveCapture?: EventMap<MouseEvent>;
	onMouseOut?: EventMap<MouseEvent>;
	onMouseOutCapture?: EventMap<MouseEvent>;
	onMouseOver?: EventMap<MouseEvent>;
	onMouseOverCapture?: EventMap<MouseEvent>;
	onMouseUp?: EventMap<MouseEvent>;
	onMouseUpCapture?: EventMap<MouseEvent>;

	// Selection Events
	onSelect?: EventMap<Event>;
	onSelectCapture?: EventMap<Event>;

	// Touch Events
	onTouchCancel?: EventMap<TouchEvent>;
	onTouchCancelCapture?: EventMap<TouchEvent>;
	onTouchEnd?: EventMap<TouchEvent>;
	onTouchEndCapture?: EventMap<TouchEvent>;
	onTouchMove?: EventMap<TouchEvent>;
	onTouchMoveCapture?: EventMap<TouchEvent>;
	onTouchStart?: EventMap<TouchEvent>;
	onTouchStartCapture?: EventMap<TouchEvent>;

	// Pointer Events
	onPointerDown?: EventMap<PointerEvent>;
	onPointerDownCapture?: EventMap<PointerEvent>;
	onPointerMove?: EventMap<PointerEvent>;
	onPointerMoveCapture?: EventMap<PointerEvent>;
	onPointerUp?: EventMap<PointerEvent>;
	onPointerUpCapture?: EventMap<PointerEvent>;
	onPointerCancel?: EventMap<PointerEvent>;
	onPointerCancelCapture?: EventMap<PointerEvent>;
	onPointerEnter?: EventMap<PointerEvent>;
	onPointerEnterCapture?: EventMap<PointerEvent>;
	onPointerLeave?: EventMap<PointerEvent>;
	onPointerLeaveCapture?: EventMap<PointerEvent>;
	onPointerOver?: EventMap<PointerEvent>;
	onPointerOverCapture?: EventMap<PointerEvent>;
	onPointerOut?: EventMap<PointerEvent>;
	onPointerOutCapture?: EventMap<PointerEvent>;
	onGotPointerCapture?: EventMap<PointerEvent>;
	onGotPointerCaptureCapture?: EventMap<PointerEvent>;
	onLostPointerCapture?: EventMap<PointerEvent>;
	onLostPointerCaptureCapture?: EventMap<PointerEvent>;

	// UI Events
	onScroll?: EventMap<UIEvent>;
	onScrollCapture?: EventMap<UIEvent>;

	// Wheel Events
	onWheel?: EventMap<WheelEvent>;
	onWheelCapture?: EventMap<WheelEvent>;

	// Animation Events
	onAnimationStart?: EventMap<AnimationEvent>;
	onAnimationStartCapture?: EventMap<AnimationEvent>;
	onAnimationEnd?: EventMap<AnimationEvent>;
	onAnimationEndCapture?: EventMap<AnimationEvent>;
	onAnimationIteration?: EventMap<AnimationEvent>;
	onAnimationIterationCapture?: EventMap<AnimationEvent>;

	// Transition Events
	onTransitionEnd?: EventMap<TransitionEvent>;
	onTransitionEndCapture?: EventMap<TransitionEvent>;
}

export interface AriaAttributes {
	/** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
	'aria-activedescendant'?: string;
	/** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
	'aria-atomic'?: boolean | 'false' | 'true';
	/**
	 * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
	 * presented if they are made.
	 */
	'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
	/** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
	'aria-busy'?: boolean | 'false' | 'true';
	/**
	 * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
	 * @see aria-pressed @see aria-selected.
	 */
	'aria-checked'?: boolean | 'false' | 'mixed' | 'true';
	/**
	 * Defines the total number of columns in a table, grid, or treegrid.
	 * @see aria-colindex.
	 */
	'aria-colcount'?: number;
	/**
	 * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
	 * @see aria-colcount @see aria-colspan.
	 */
	'aria-colindex'?: number;
	/**
	 * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
	 * @see aria-colindex @see aria-rowspan.
	 */
	'aria-colspan'?: number;
	/**
	 * Identifies the element (or elements) whose contents or presence are controlled by the current element.
	 * @see aria-owns.
	 */
	'aria-controls'?: string;
	/** Indicates the element that represents the current item within a container or set of related elements. */
	'aria-current'?: boolean | 'false' | 'true' | 'page' | 'step' | 'location' | 'date' | 'time';
	/**
	 * Identifies the element (or elements) that describes the object.
	 * @see aria-labelledby
	 */
	'aria-describedby'?: string;
	/**
	 * Identifies the element that provides a detailed, extended description for the object.
	 * @see aria-describedby.
	 */
	'aria-details'?: string;
	/**
	 * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
	 * @see aria-hidden @see aria-readonly.
	 */
	'aria-disabled'?: boolean | 'false' | 'true';
	/**
	 * Indicates what functions can be performed when a dragged object is released on the drop target.
	 * @deprecated in ARIA 1.1
	 */
	'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
	/**
	 * Identifies the element that provides an error message for the object.
	 * @see aria-invalid @see aria-describedby.
	 */
	'aria-errormessage'?: string;
	/** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
	'aria-expanded'?: boolean | 'false' | 'true';
	/**
	 * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
	 * allows assistive technology to override the general default of reading in document source order.
	 */
	'aria-flowto'?: string;
	/**
	 * Indicates an element's "grabbed" state in a drag-and-drop operation.
	 * @deprecated in ARIA 1.1
	 */
	'aria-grabbed'?: boolean | 'false' | 'true';
	/** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
	'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
	/**
	 * Indicates whether the element is exposed to an accessibility API.
	 * @see aria-disabled.
	 */
	'aria-hidden'?: boolean | 'false' | 'true';
	/**
	 * Indicates the entered value does not conform to the format expected by the application.
	 * @see aria-errormessage.
	 */
	'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling';
	/** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
	'aria-keyshortcuts'?: string;
	/**
	 * Defines a string value that labels the current element.
	 * @see aria-labelledby.
	 */
	'aria-label'?: string;
	/**
	 * Identifies the element (or elements) that labels the current element.
	 * @see aria-describedby.
	 */
	'aria-labelledby'?: string;
	/** Defines the hierarchical level of an element within a structure. */
	'aria-level'?: number;
	/** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
	'aria-live'?: 'off' | 'assertive' | 'polite';
	/** Indicates whether an element is modal when displayed. */
	'aria-modal'?: boolean | 'false' | 'true';
	/** Indicates whether a text box accepts multiple lines of input or only a single line. */
	'aria-multiline'?: boolean | 'false' | 'true';
	/** Indicates that the user may select more than one item from the current selectable descendants. */
	'aria-multiselectable'?: boolean | 'false' | 'true';
	/** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
	'aria-orientation'?: 'horizontal' | 'vertical';
	/**
	 * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
	 * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
	 * @see aria-controls.
	 */
	'aria-owns'?: string;
	/**
	 * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
	 * A hint could be a sample value or a brief description of the expected format.
	 */
	'aria-placeholder'?: string;
	/**
	 * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
	 * @see aria-setsize.
	 */
	'aria-posinset'?: number;
	/**
	 * Indicates the current "pressed" state of toggle buttons.
	 * @see aria-checked @see aria-selected.
	 */
	'aria-pressed'?: boolean | 'false' | 'mixed' | 'true';
	/**
	 * Indicates that the element is not editable, but is otherwise operable.
	 * @see aria-disabled.
	 */
	'aria-readonly'?: boolean | 'false' | 'true';
	/**
	 * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
	 * @see aria-atomic.
	 */
	'aria-relevant'?: 'additions' | 'additions removals' | 'additions text' | 'all' | 'removals' | 'removals additions' | 'removals text' | 'text' | 'text additions' | 'text removals';
	/** Indicates that user input is required on the element before a form may be submitted. */
	'aria-required'?: boolean | 'false' | 'true';
	/** Defines a human-readable, author-localized description for the role of an element. */
	'aria-roledescription'?: string;
	/**
	 * Defines the total number of rows in a table, grid, or treegrid.
	 * @see aria-rowindex.
	 */
	'aria-rowcount'?: number;
	/**
	 * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
	 * @see aria-rowcount @see aria-rowspan.
	 */
	'aria-rowindex'?: number;
	/**
	 * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
	 * @see aria-rowindex @see aria-colspan.
	 */
	'aria-rowspan'?: number;
	/**
	 * Indicates the current "selected" state of various widgets.
	 * @see aria-checked @see aria-pressed.
	 */
	'aria-selected'?: boolean | 'false' | 'true';
	/**
	 * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
	 * @see aria-posinset.
	 */
	'aria-setsize'?: number;
	/** Indicates if items in a table or grid are sorted in ascending or descending order. */
	'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
	/** Defines the maximum allowed value for a range widget. */
	'aria-valuemax'?: number;
	/** Defines the minimum allowed value for a range widget. */
	'aria-valuemin'?: number;
	/**
	 * Defines the current value for a range widget.
	 * @see aria-valuetext.
	 */
	'aria-valuenow'?: number;
	/** Defines the human readable text alternative of aria-valuenow for a range widget. */
	'aria-valuetext'?: string;
}

export interface HTMLAttributes extends AriaAttributes, DOMAttributes {

	// Standard HTML Attributes
	accessKey?: string;
	// className?: string;
	'class'?: string;
	contentEditable?: boolean | "inherit";
	contextMenu?: string;
	dir?: string;
	draggable?: boolean;
	hidden?: boolean;
	id?: string;
	lang?: string;
	placeholder?: string;
	slot?: string;
	spellCheck?: boolean;
	style?: { [key: string]: any };
	tabIndex?: number;
	title?: string;
	translate?: 'yes' | 'no';

	// Unknown
	radioGroup?: string; // <command>, <menuitem>

	// WAI-ARIA
	role?: string;

	// RDFa Attributes
	about?: string;
	datatype?: string;
	inlist?: any;
	prefix?: string;
	property?: string;
	resource?: string;
	typeof?: string;
	vocab?: string;

	// Non-standard Attributes
	autoCapitalize?: string;
	autoCorrect?: string;
	autoSave?: string;
	color?: string;
	itemProp?: string;
	itemScope?: boolean;
	itemType?: string;
	itemID?: string;
	itemRef?: string;
	results?: number;
	security?: string;
	unselectable?: 'on' | 'off';

	// Living Standard
	/**
	 * Hints at the type of data that might be entered by the user while editing the element or its contents
	 * @see https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute
	 */
	inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
	/**
	 * Specify that a standard HTML element should behave like a defined custom built-in element
	 * @see https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is
	 */
	is?: string;

	// binding 
	// Standard HTML Attributes
	$accessKey?: string;
	// className?: string;
	$class?: string;
	$contentEditable?: boolean | "inherit";
	$contextMenu?: string;
	$dir?: string;
	$draggable?: boolean;
	$hidden?: boolean;
	$id?: string;
	$lang?: string;
	$placeholder?: string;
	$slot?: string;
	$spellCheck?: boolean;
	$style?: { [key: string]: any };
	$tabIndex?: number;
	$title?: string;
	$translate?: 'yes' | 'no';

	// Unknown
	$radioGroup?: string; // <command>, <menuitem>

	// WAI-ARIA
	$role?: string;

	// RDFa Attributes
	$about?: string;
	$datatype?: string;
	$inlist?: any;
	$prefix?: string;
	$property?: string;
	$resource?: string;
	$typeof?: string;
	$vocab?: string;

	// Non-standard Attributes
	$autoCapitalize?: string;
	$autoCorrect?: string;
	$autoSave?: string;
	$color?: string;
	$itemProp?: string;
	$itemScope?: boolean;
	$itemType?: string;
	$itemID?: string;
	$itemRef?: string;
	$results?: number;
	$security?: string;
	$unselectable?: 'on' | 'off';
}

export interface AllHTMLAttributes extends HTMLAttributes {
	// Standard HTML Attributes
	accept?: string;
	acceptCharset?: string;
	action?: string;
	allowFullScreen?: boolean;
	allowTransparency?: boolean;
	alt?: string;
	as?: string;
	async?: boolean;
	autoComplete?: string;
	autoFocus?: boolean;
	autoPlay?: boolean;
	capture?: boolean | string;
	cellPadding?: number | string;
	cellSpacing?: number | string;
	charSet?: string;
	challenge?: string;
	checked?: boolean;
	cite?: string;
	classID?: string;
	cols?: number;
	colSpan?: number;
	content?: string;
	controls?: boolean;
	coords?: string;
	crossOrigin?: string;
	data?: string;
	dateTime?: string;
	'default'?: boolean;
	defer?: boolean;
	disabled?: boolean;
	download?: any;
	encType?: string;
	form?: string;
	formAction?: string;
	formEncType?: string;
	formMethod?: string;
	formNoValidate?: boolean;
	formTarget?: string;
	frameBorder?: number | string;
	headers?: string;
	height?: number | string;
	high?: number;
	href?: string;
	hrefLang?: string;
	htmlFor?: string;
	httpEquiv?: string;
	integrity?: string;
	keyParams?: string;
	keyType?: string;
	kind?: string;
	label?: string;
	list?: string;
	loop?: boolean;
	low?: number;
	manifest?: string;
	marginHeight?: number;
	marginWidth?: number;
	max?: number | string;
	maxLength?: number;
	media?: string;
	mediaGroup?: string;
	method?: string;
	min?: number | string;
	minLength?: number;
	multiple?: boolean;
	muted?: boolean;
	name?: string;
	nonce?: string;
	noValidate?: boolean;
	open?: boolean;
	optimum?: number;
	pattern?: string;
	placeholder?: string;
	playsInline?: boolean;
	poster?: string;
	preload?: string;
	readOnly?: boolean;
	rel?: string;
	required?: boolean;
	reversed?: boolean;
	rows?: number;
	rowSpan?: number;
	sandbox?: string;
	scope?: string;
	scoped?: boolean;
	scrolling?: string;
	seamless?: boolean;
	selected?: boolean;
	shape?: string;
	size?: number;
	sizes?: string;
	span?: number;
	src?: string;
	srcDoc?: string;
	srcLang?: string;
	srcSet?: string;
	start?: number;
	step?: number | string;
	summary?: string;
	target?: string;
	type?: string;
	useMap?: string;
	value?: string | ReadonlyArray<string> | number;
	width?: number | string;
	wmode?: string;
	wrap?: string;

	// binding 
	$accept?: string;
	$acceptCharset?: string;
	$action?: string;
	$allowFullScreen?: boolean;
	$allowTransparency?: boolean;
	$alt?: string;
	$as?: string;
	$async?: boolean;
	$autoComplete?: string;
	$autoFocus?: boolean;
	$autoPlay?: boolean;
	$capture?: boolean | string;
	$cellPadding?: number | string;
	$cellSpacing?: number | string;
	$charSet?: string;
	$challenge?: string;
	$checked?: boolean;
	$cite?: string;
	$classID?: string;
	$cols?: number;
	$colSpan?: number;
	$content?: string;
	$controls?: boolean;
	$coords?: string;
	$crossOrigin?: string;
	$data?: string;
	$dateTime?: string;
	$default?: boolean;
	$defer?: boolean;
	$disabled?: boolean;
	$download?: any;
	$encType?: string;
	$form?: string;
	$formAction?: string;
	$formEncType?: string;
	$formMethod?: string;
	$formNoValidate?: boolean;
	$formTarget?: string;
	$frameBorder?: number | string;
	$headers?: string;
	$height?: number | string;
	$high?: number;
	$href?: string;
	$hrefLang?: string;
	$htmlFor?: string;
	$httpEquiv?: string;
	$integrity?: string;
	$keyParams?: string;
	$keyType?: string;
	$kind?: string;
	$label?: string;
	$list?: string;
	$loop?: boolean;
	$low?: number;
	$manifest?: string;
	$marginHeight?: number;
	$marginWidth?: number;
	$max?: number | string;
	$maxLength?: number;
	$media?: string;
	$mediaGroup?: string;
	$method?: string;
	$min?: number | string;
	$minLength?: number;
	$multiple?: boolean;
	$muted?: boolean;
	$name?: string;
	$nonce?: string;
	$noValidate?: boolean;
	$open?: boolean;
	$optimum?: number;
	$pattern?: string;
	$placeholder?: string;
	$playsInline?: boolean;
	$poster?: string;
	$preload?: string;
	$readOnly?: boolean;
	$rel?: string;
	$required?: boolean;
	$reversed?: boolean;
	$rows?: number;
	$rowSpan?: number;
	$sandbox?: string;
	$scope?: string;
	$scoped?: boolean;
	$scrolling?: string;
	$seamless?: boolean;
	$selected?: boolean;
	$shape?: string;
	$size?: number;
	$sizes?: string;
	$span?: number;
	$src?: string;
	$srcDoc?: string;
	$srcLang?: string;
	$srcSet?: string;
	$start?: number;
	$step?: number | string;
	$summary?: string;
	$target?: string;
	$type?: string;
	$useMap?: string;
	$value?: string | ReadonlyArray<string> | number;
	$width?: number | string;
	$wmode?: string;
	$wrap?: string;
}

export interface AnchorHTMLAttributes extends HTMLAttributes {
	download?: any;
	href?: string;
	hrefLang?: string;
	media?: string;
	ping?: string;
	rel?: string;
	target?: string;
	type?: string;
	referrerPolicy?: string;

	// binding
	$download?: any;
	$href?: string;
	$hrefLang?: string;
	$media?: string;
	$ping?: string;
	$rel?: string;
	$target?: string;
	$type?: string;
	$referrerPolicy?: string;
}

export interface AreaHTMLAttributes extends HTMLAttributes {
	alt?: string;
	coords?: string;
	download?: any;
	href?: string;
	hrefLang?: string;
	media?: string;
	rel?: string;
	shape?: string;
	target?: string;

	// binding

	$alt?: string;
	$coords?: string;
	$download?: any;
	$href?: string;
	$hrefLang?: string;
	$media?: string;
	$rel?: string;
	$shape?: string;
	$target?: string;
}

export interface BaseHTMLAttributes extends HTMLAttributes {
	href?: string;
	target?: string;

	// binding
	$href?: string;
	$target?: string;
}

export interface BlockquoteHTMLAttributes extends HTMLAttributes {
	cite?: string;

	// binding
	$cite?: string;
}

export interface ButtonHTMLAttributes extends HTMLAttributes {
	autoFocus?: boolean;
	disabled?: boolean;
	form?: string;
	formAction?: string;
	formEncType?: string;
	formMethod?: string;
	formNoValidate?: boolean;
	formTarget?: string;
	name?: string;
	type?: 'submit' | 'reset' | 'button';
	value?: string | ReadonlyArray<string> | number;

	// binding
	$autoFocus?: boolean;
	$disabled?: boolean;
	$form?: string;
	$formAction?: string;
	$formEncType?: string;
	$formMethod?: string;
	$formNoValidate?: boolean;
	$formTarget?: string;
	$name?: string;
	$type?: 'submit' | 'reset' | 'button';
	$value?: string | ReadonlyArray<string> | number;
}

export interface CanvasHTMLAttributes extends HTMLAttributes {
	height?: number | string;
	width?: number | string;

	// binding
	$height?: number | string;
	$width?: number | string;
}

export interface ColHTMLAttributes extends HTMLAttributes {
	span?: number;
	width?: number | string;

	// binding
	$span?: number;
	$width?: number | string;
}

export interface ColgroupHTMLAttributes extends HTMLAttributes {
	span?: number;

	// binding
	$span?: number;
}

export interface DataHTMLAttributes extends HTMLAttributes {
	value?: string | ReadonlyArray<string> | number;

	// binding
	$value?: string | ReadonlyArray<string> | number;
}

export interface DetailsHTMLAttributes extends HTMLAttributes {
	open?: boolean;
	onToggle?: EventMap<Event>;

	// binding
	$open?: boolean;
}

export interface DelHTMLAttributes extends HTMLAttributes {
	cite?: string;
	dateTime?: string;

	// binding
	$cite?: string;
	$dateTime?: string;
}

export interface DialogHTMLAttributes extends HTMLAttributes {
	open?: boolean;

	// binding
	$open?: boolean;
}

export interface EmbedHTMLAttributes extends HTMLAttributes {
	height?: number | string;
	src?: string;
	type?: string;
	width?: number | string;

	// binding
	$height?: number | string;
	$src?: string;
	$type?: string;
	$width?: number | string;
}

export interface FieldsetHTMLAttributes extends HTMLAttributes {
	disabled?: boolean;
	form?: string;
	name?: string;

	// binding
	$disabled?: boolean;
	$form?: string;
	$name?: string;
}

export interface FormHTMLAttributes extends HTMLAttributes {
	acceptCharset?: string;
	action?: string;
	autoComplete?: string;
	encType?: string;
	method?: string;
	name?: string;
	noValidate?: boolean;
	target?: string;

	// binding
	$acceptCharset?: string;
	$action?: string;
	$autoComplete?: string;
	$encType?: string;
	$method?: string;
	$name?: string;
	$noValidate?: boolean;
	$target?: string;
}

export interface HtmlHTMLAttributes extends HTMLAttributes {
	manifest?: string;

	// binding
	$manifest?: string;
}

export interface IframeHTMLAttributes extends HTMLAttributes {
	allow?: string;
	allowFullScreen?: boolean;
	allowTransparency?: boolean;
	height?: number | string;
	loading?: "eager" | "lazy";
	name?: string;
	referrerPolicy?: string;
	sandbox?: string;
	seamless?: boolean;
	src?: string;
	srcDoc?: string;
	width?: number | string;

	// binding
	$allow?: string;
	$allowFullScreen?: boolean;
	$allowTransparency?: boolean;
	$height?: number | string;
	$loading?: "eager" | "lazy";
	$name?: string;
	$referrerPolicy?: string;
	$sandbox?: string;
	$seamless?: boolean;
	$src?: string;
	$srcDoc?: string;
	$width?: number | string;
}

export interface ImgHTMLAttributes extends HTMLAttributes {
	alt?: string;
	crossOrigin?: "anonymous" | "use-credentials" | "";
	decoding?: "async" | "auto" | "sync";
	height?: number | string;
	loading?: "eager" | "lazy";
	referrerPolicy?: "no-referrer" | "origin" | "unsafe-url";
	sizes?: string;
	src?: string;
	srcSet?: string;
	useMap?: string;
	width?: number | string;

	// binding
	$alt?: string;
	$crossOrigin?: "anonymous" | "use-credentials" | "";
	$decoding?: "async" | "auto" | "sync";
	$height?: number | string;
	$loading?: "eager" | "lazy";
	$referrerPolicy?: "no-referrer" | "origin" | "unsafe-url";
	$sizes?: string;
	$src?: string;
	$srcSet?: string;
	$useMap?: string;
	$width?: number | string;
}

export interface InsHTMLAttributes extends HTMLAttributes {
	cite?: string;
	dateTime?: string;

	// binding
	$cite?: string;
	$dateTime?: string;
}

export interface InputHTMLAttributes extends HTMLAttributes {
	accept?: string;
	alt?: string;
	autoComplete?: string;
	autoFocus?: boolean;
	capture?: boolean | string; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
	checked?: boolean;
	crossOrigin?: string;
	disabled?: boolean;
	form?: string;
	formAction?: string;
	formEncType?: string;
	formMethod?: string;
	formNoValidate?: boolean;
	formTarget?: string;
	height?: number | string;
	list?: string;
	max?: number | string;
	maxLength?: number;
	min?: number | string;
	minLength?: number;
	multiple?: boolean;
	name?: string;
	pattern?: string;
	placeholder?: string;
	readOnly?: boolean;
	required?: boolean;
	size?: number;
	src?: string;
	step?: number | string;
	type?: string;
	value?: string | ReadonlyArray<string> | number;
	width?: number | string;

	onChange?: EventMap<Event>;

	// binding
	$accept?: string;
	$alt?: string;
	$autoComplete?: string;
	$autoFocus?: boolean;
	$capture?: boolean | string; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
	$checked?: boolean;
	$crossOrigin?: string;
	$disabled?: boolean;
	$form?: string;
	$formAction?: string;
	$formEncType?: string;
	$formMethod?: string;
	$formNoValidate?: boolean;
	$formTarget?: string;
	$height?: number | string;
	$list?: string;
	$max?: number | string;
	$maxLength?: number;
	$min?: number | string;
	$minLength?: number;
	$multiple?: boolean;
	$name?: string;
	$pattern?: string;
	$placeholder?: string;
	$readOnly?: boolean;
	$required?: boolean;
	$size?: number;
	$src?: string;
	$step?: number | string;
	$type?: string;
	$value?: string | ReadonlyArray<string> | number;
	$width?: number | string;
}

export interface KeygenHTMLAttributes extends HTMLAttributes {
	autoFocus?: boolean;
	challenge?: string;
	disabled?: boolean;
	form?: string;
	keyType?: string;
	keyParams?: string;
	name?: string;

	// binding
	$autoFocus?: boolean;
	$challenge?: string;
	$disabled?: boolean;
	$form?: string;
	$keyType?: string;
	$keyParams?: string;
	$name?: string;
}

export interface LabelHTMLAttributes extends HTMLAttributes {
	form?: string;
	htmlFor?: string;

	// binding
	$form?: string;
	$htmlFor?: string;
}

export interface LiHTMLAttributes extends HTMLAttributes {
	value?: string | ReadonlyArray<string> | number;

	// binding
	$value?: string | ReadonlyArray<string> | number;
}

export interface LinkHTMLAttributes extends HTMLAttributes {
	as?: string;
	crossOrigin?: string;
	href?: string;
	hrefLang?: string;
	integrity?: string;
	media?: string;
	rel?: string;
	sizes?: string;
	type?: string;
	charSet?: string;

	// binding
	$as?: string;
	$crossOrigin?: string;
	$href?: string;
	$hrefLang?: string;
	$integrity?: string;
	$media?: string;
	$rel?: string;
	$sizes?: string;
	$type?: string;
	$charSet?: string;
}

export interface MapHTMLAttributes extends HTMLAttributes {
	name?: string;

	// binding
	$name?: string;
}

export interface MenuHTMLAttributes extends HTMLAttributes {
	type?: string;

	// binding
	$type?: string;
}

export interface MetaHTMLAttributes extends HTMLAttributes {
	charSet?: string;
	content?: string;
	httpEquiv?: string;
	name?: string;

	// binding
	$charSet?: string;
	$content?: string;
	$httpEquiv?: string;
	$name?: string;
}

export interface MeterHTMLAttributes extends HTMLAttributes {
	form?: string;
	high?: number;
	low?: number;
	max?: number | string;
	min?: number | string;
	optimum?: number;
	value?: string | ReadonlyArray<string> | number;

	// binding
	$form?: string;
	$high?: number;
	$low?: number;
	$max?: number | string;
	$min?: number | string;
	$optimum?: number;
	$value?: string | ReadonlyArray<string> | number;
}

export interface QuoteHTMLAttributes extends HTMLAttributes {
	cite?: string;

	// binding
	$cite?: string;
}

export interface ObjectHTMLAttributes extends HTMLAttributes {
	classID?: string;
	data?: string;
	form?: string;
	height?: number | string;
	name?: string;
	type?: string;
	useMap?: string;
	width?: number | string;
	wmode?: string;

	// binding
	$classID?: string;
	$data?: string;
	$form?: string;
	$height?: number | string;
	$name?: string;
	$type?: string;
	$useMap?: string;
	$width?: number | string;
	$wmode?: string;
}

export interface OlHTMLAttributes extends HTMLAttributes {
	reversed?: boolean;
	start?: number;
	type?: '1' | 'a' | 'A' | 'i' | 'I';

	// binding
	$reversed?: boolean;
	$start?: number;
	$type?: '1' | 'a' | 'A' | 'i' | 'I';
}

export interface OptgroupHTMLAttributes extends HTMLAttributes {
	disabled?: boolean;
	label?: string;

	// binding
	$disabled?: boolean;
	$label?: string;
}

export interface OptionHTMLAttributes extends HTMLAttributes {
	disabled?: boolean;
	label?: string;
	selected?: boolean;
	value?: string | ReadonlyArray<string> | number;

	// binding
	$disabled?: boolean;
	$label?: string;
	$selected?: boolean;
	$value?: string | ReadonlyArray<string> | number;
}

export interface OutputHTMLAttributes extends HTMLAttributes {
	form?: string;
	htmlFor?: string;
	name?: string;

	// binding
	$form?: string;
	$htmlFor?: string;
	$name?: string;
}

export interface ParamHTMLAttributes extends HTMLAttributes {
	name?: string;
	value?: string | ReadonlyArray<string> | number;

	// binding
	$name?: string;
	$value?: string | ReadonlyArray<string> | number;
}

export interface ProgressHTMLAttributes extends HTMLAttributes {
	max?: number | string;
	value?: string | ReadonlyArray<string> | number;

	// binding
	$max?: number | string;
	$value?: string | ReadonlyArray<string> | number;
}

export interface SlotHTMLAttributes extends HTMLAttributes {
	name?: string;

	// binding
	$name?: string;
}

export interface ScriptHTMLAttributes extends HTMLAttributes {
	async?: boolean;
	charSet?: string;
	crossOrigin?: string;
	defer?: boolean;
	integrity?: string;
	noModule?: boolean;
	nonce?: string;
	src?: string;
	type?: string;

	// binding
	$async?: boolean;
	$charSet?: string;
	$crossOrigin?: string;
	$defer?: boolean;
	$integrity?: string;
	$noModule?: boolean;
	$nonce?: string;
	$src?: string;
	$type?: string;
}

export interface SelectHTMLAttributes extends HTMLAttributes {
	autoComplete?: string;
	autoFocus?: boolean;
	disabled?: boolean;
	form?: string;
	multiple?: boolean;
	name?: string;
	required?: boolean;
	size?: number;
	value?: string | ReadonlyArray<string> | number;
	onChange?: EventMap<Event>;

	// binding
	$autoComplete?: string;
	$autoFocus?: boolean;
	$disabled?: boolean;
	$form?: string;
	$multiple?: boolean;
	$name?: string;
	$required?: boolean;
	$size?: number;
	$value?: string | ReadonlyArray<string> | number;
}

export interface SourceHTMLAttributes extends HTMLAttributes {
	media?: string;
	sizes?: string;
	src?: string;
	srcSet?: string;
	type?: string;

	// binding
	$media?: string;
	$sizes?: string;
	$src?: string;
	$srcSet?: string;
	$type?: string;
}

export interface StyleHTMLAttributes extends HTMLAttributes {
	media?: string;
	nonce?: string;
	scoped?: boolean;
	type?: string;

	// binding
	$media?: string;
	$nonce?: string;
	$scoped?: boolean;
	$type?: string;
}

export interface TableHTMLAttributes extends HTMLAttributes {
	cellPadding?: number | string;
	cellSpacing?: number | string;
	summary?: string;
	width?: number | string;

	// binding
	$cellPadding?: number | string;
	$cellSpacing?: number | string;
	$summary?: string;
	$width?: number | string;
}

export interface TextareaHTMLAttributes extends HTMLAttributes {
	autoComplete?: string;
	autoFocus?: boolean;
	cols?: number;
	dirName?: string;
	disabled?: boolean;
	form?: string;
	maxLength?: number;
	minLength?: number;
	name?: string;
	placeholder?: string;
	readOnly?: boolean;
	required?: boolean;
	rows?: number;
	value?: string | ReadonlyArray<string> | number;
	wrap?: string;

	onChange?: EventMap<Event>;

	// binding
	$autoComplete?: string;
	$autoFocus?: boolean;
	$cols?: number;
	$dirName?: string;
	$disabled?: boolean;
	$form?: string;
	$maxLength?: number;
	$minLength?: number;
	$name?: string;
	$placeholder?: string;
	$readOnly?: boolean;
	$required?: boolean;
	$rows?: number;
	$value?: string | ReadonlyArray<string> | number;
	$wrap?: string;
}

export interface TdHTMLAttributes extends HTMLAttributes {
	align?: "left" | "center" | "right" | "justify" | "char";
	colSpan?: number;
	headers?: string;
	rowSpan?: number;
	scope?: string;
	abbr?: string;
	height?: number | string;
	width?: number | string;
	valign?: "top" | "middle" | "bottom" | "baseline";

	// binding
	$align?: "left" | "center" | "right" | "justify" | "char";
	$colSpan?: number;
	$headers?: string;
	$rowSpan?: number;
	$scope?: string;
	$abbr?: string;
	$height?: number | string;
	$width?: number | string;
	$valign?: "top" | "middle" | "bottom" | "baseline";
}

export interface ThHTMLAttributes extends HTMLAttributes {
	align?: "left" | "center" | "right" | "justify" | "char";
	colSpan?: number;
	headers?: string;
	rowSpan?: number;
	scope?: string;
	abbr?: string;

	// binding
	$align?: "left" | "center" | "right" | "justify" | "char";
	$colSpan?: number;
	$headers?: string;
	$rowSpan?: number;
	$scope?: string;
	$abbr?: string;
}

export interface TimeHTMLAttributes extends HTMLAttributes {
	dateTime?: string;

	// binding
	$dateTime?: string;

}

export interface TrackHTMLAttributes extends HTMLAttributes {
	default?: boolean;
	kind?: string;
	label?: string;
	src?: string;
	srcLang?: string;

	// binding
	$default?: boolean;
	$kind?: string;
	$label?: string;
	$src?: string;
	$srcLang?: string;
}

export interface MediaHTMLAttributes extends HTMLAttributes {
	autoPlay?: boolean;
	controls?: boolean;
	controlsList?: string;
	crossOrigin?: string;
	loop?: boolean;
	mediaGroup?: string;
	muted?: boolean;
	playsInline?: boolean;
	preload?: string;
	src?: string;

	// binding
	$autoPlay?: boolean;
	$controls?: boolean;
	$controlsList?: string;
	$crossOrigin?: string;
	$loop?: boolean;
	$mediaGroup?: string;
	$muted?: boolean;
	$playsInline?: boolean;
	$preload?: string;
	$src?: string;
}

// tslint:disable-next-line:no-empty-interface
export interface AudioHTMLAttributes extends MediaHTMLAttributes { }

export interface VideoHTMLAttributes extends MediaHTMLAttributes {
	height?: number | string;
	playsInline?: boolean;
	poster?: string;
	width?: number | string;
	disablePictureInPicture?: boolean;

	// binding
	$height?: number | string;
	$playsInline?: boolean;
	$poster?: string;
	$width?: number | string;
	$disablePictureInPicture?: boolean;
}

export interface SVGAttributes extends AriaAttributes, DOMAttributes {
	// Attributes which also defined in HTMLAttributes
	// See comment in SVGDOMPropertyConfig.js
	'class'?: string;
	color?: string;
	height?: number | string;
	id?: string;
	lang?: string;
	max?: number | string;
	media?: string;
	method?: string;
	min?: number | string;
	name?: string;
	style?: { [key: string]: any };
	target?: string;
	type?: string;
	width?: number | string;

	// Other HTML properties supported by SVG elements in browsers
	role?: string;
	tabIndex?: number;
	crossOrigin?: "anonymous" | "use-credentials" | "";

	// SVG Specific attributes
	accentHeight?: number | string;
	accumulate?: "none" | "sum";
	additive?: "replace" | "sum";
	alignmentBaseline?: "auto" | "baseline" | "before-edge" | "text-before-edge" | "middle" | "central" | "after-edge" |
	"text-after-edge" | "ideographic" | "alphabetic" | "hanging" | "mathematical" | "inherit";
	allowReorder?: "no" | "yes";
	alphabetic?: number | string;
	amplitude?: number | string;
	arabicForm?: "initial" | "medial" | "terminal" | "isolated";
	ascent?: number | string;
	attributeName?: string;
	attributeType?: string;
	autoReverse?: boolean;
	azimuth?: number | string;
	baseFrequency?: number | string;
	baselineShift?: number | string;
	baseProfile?: number | string;
	bbox?: number | string;
	begin?: number | string;
	bias?: number | string;
	by?: number | string;
	calcMode?: number | string;
	capHeight?: number | string;
	clip?: number | string;
	clipPath?: string;
	clipPathUnits?: number | string;
	clipRule?: number | string;
	colorInterpolation?: number | string;
	colorInterpolationFilters?: "auto" | "sRGB" | "linearRGB" | "inherit";
	colorProfile?: number | string;
	colorRendering?: number | string;
	contentScriptType?: number | string;
	contentStyleType?: number | string;
	cursor?: number | string;
	cx?: number | string;
	cy?: number | string;
	d?: string;
	decelerate?: number | string;
	descent?: number | string;
	diffuseConstant?: number | string;
	direction?: number | string;
	display?: number | string;
	divisor?: number | string;
	dominantBaseline?: number | string;
	dur?: number | string;
	dx?: number | string;
	dy?: number | string;
	edgeMode?: number | string;
	elevation?: number | string;
	enableBackground?: number | string;
	end?: number | string;
	exponent?: number | string;
	externalResourcesRequired?: boolean;
	fill?: string;
	fillOpacity?: number | string;
	fillRule?: "nonzero" | "evenodd" | "inherit";
	filter?: string;
	filterRes?: number | string;
	filterUnits?: number | string;
	floodColor?: number | string;
	floodOpacity?: number | string;
	focusable?: boolean | "auto";
	fontFamily?: string;
	fontSize?: number | string;
	fontSizeAdjust?: number | string;
	fontStretch?: number | string;
	fontStyle?: number | string;
	fontVariant?: number | string;
	fontWeight?: number | string;
	format?: number | string;
	from?: number | string;
	fx?: number | string;
	fy?: number | string;
	g1?: number | string;
	g2?: number | string;
	glyphName?: number | string;
	glyphOrientationHorizontal?: number | string;
	glyphOrientationVertical?: number | string;
	glyphRef?: number | string;
	gradientTransform?: string;
	gradientUnits?: string;
	hanging?: number | string;
	horizAdvX?: number | string;
	horizOriginX?: number | string;
	href?: string;
	ideographic?: number | string;
	imageRendering?: number | string;
	in2?: number | string;
	in?: string;
	intercept?: number | string;
	k1?: number | string;
	k2?: number | string;
	k3?: number | string;
	k4?: number | string;
	k?: number | string;
	kernelMatrix?: number | string;
	kernelUnitLength?: number | string;
	kerning?: number | string;
	keyPoints?: number | string;
	keySplines?: number | string;
	keyTimes?: number | string;
	lengthAdjust?: number | string;
	letterSpacing?: number | string;
	lightingColor?: number | string;
	limitingConeAngle?: number | string;
	local?: number | string;
	markerEnd?: string;
	markerHeight?: number | string;
	markerMid?: string;
	markerStart?: string;
	markerUnits?: number | string;
	markerWidth?: number | string;
	mask?: string;
	maskContentUnits?: number | string;
	maskUnits?: number | string;
	mathematical?: number | string;
	mode?: number | string;
	numOctaves?: number | string;
	offset?: number | string;
	opacity?: number | string;
	operator?: number | string;
	order?: number | string;
	orient?: number | string;
	orientation?: number | string;
	origin?: number | string;
	overflow?: number | string;
	overlinePosition?: number | string;
	overlineThickness?: number | string;
	paintOrder?: number | string;
	panose1?: number | string;
	path?: string;
	pathLength?: number | string;
	patternContentUnits?: string;
	patternTransform?: number | string;
	patternUnits?: string;
	pointerEvents?: number | string;
	points?: string;
	pointsAtX?: number | string;
	pointsAtY?: number | string;
	pointsAtZ?: number | string;
	preserveAlpha?: boolean;
	preserveAspectRatio?: string;
	primitiveUnits?: number | string;
	r?: number | string;
	radius?: number | string;
	refX?: number | string;
	refY?: number | string;
	renderingIntent?: number | string;
	repeatCount?: number | string;
	repeatDur?: number | string;
	requiredExtensions?: number | string;
	requiredFeatures?: number | string;
	restart?: number | string;
	result?: string;
	rotate?: number | string;
	rx?: number | string;
	ry?: number | string;
	scale?: number | string;
	seed?: number | string;
	shapeRendering?: number | string;
	slope?: number | string;
	spacing?: number | string;
	specularConstant?: number | string;
	specularExponent?: number | string;
	speed?: number | string;
	spreadMethod?: string;
	startOffset?: number | string;
	stdDeviation?: number | string;
	stemh?: number | string;
	stemv?: number | string;
	stitchTiles?: number | string;
	stopColor?: string;
	stopOpacity?: number | string;
	strikethroughPosition?: number | string;
	strikethroughThickness?: number | string;
	string?: number | string;
	stroke?: string;
	strokeDasharray?: string | number;
	strokeDashoffset?: string | number;
	strokeLinecap?: "butt" | "round" | "square" | "inherit";
	strokeLinejoin?: "miter" | "round" | "bevel" | "inherit";
	strokeMiterlimit?: number | string;
	strokeOpacity?: number | string;
	strokeWidth?: number | string;
	surfaceScale?: number | string;
	systemLanguage?: number | string;
	tableValues?: number | string;
	targetX?: number | string;
	targetY?: number | string;
	textAnchor?: string;
	textDecoration?: number | string;
	textLength?: number | string;
	textRendering?: number | string;
	to?: number | string;
	transform?: string;
	u1?: number | string;
	u2?: number | string;
	underlinePosition?: number | string;
	underlineThickness?: number | string;
	unicode?: number | string;
	unicodeBidi?: number | string;
	unicodeRange?: number | string;
	unitsPerEm?: number | string;
	vAlphabetic?: number | string;
	values?: string;
	vectorEffect?: number | string;
	version?: string;
	vertAdvY?: number | string;
	vertOriginX?: number | string;
	vertOriginY?: number | string;
	vHanging?: number | string;
	vIdeographic?: number | string;
	viewBox?: string;
	viewTarget?: number | string;
	visibility?: number | string;
	vMathematical?: number | string;
	widths?: number | string;
	wordSpacing?: number | string;
	writingMode?: number | string;
	x1?: number | string;
	x2?: number | string;
	x?: number | string;
	xChannelSelector?: string;
	xHeight?: number | string;
	xlinkActuate?: string;
	xlinkArcrole?: string;
	xlinkHref?: string;
	xlinkRole?: string;
	xlinkShow?: string;
	xlinkTitle?: string;
	xlinkType?: string;
	xmlBase?: string;
	xmlLang?: string;
	xmlns?: string;
	xmlnsXlink?: string;
	xmlSpace?: string;
	y1?: number | string;
	y2?: number | string;
	y?: number | string;
	yChannelSelector?: string;
	z?: number | string;
	zoomAndPan?: string;

	// binding
	$class?: string;
	$color?: string;
	$height?: number | string;
	$id?: string;
	$lang?: string;
	$max?: number | string;
	$media?: string;
	$method?: string;
	$min?: number | string;
	$name?: string;
	$style?: { [key: string]: any };
	$target?: string;
	$type?: string;
	$width?: number | string;

	// Other HTML properties supported by SVG elements in browsers
	$role?: string;
	$tabIndex?: number;
	$crossOrigin?: "anonymous" | "use-credentials" | "";

	// SVG Specific attributes
	$accentHeight?: number | string;
	$accumulate?: "none" | "sum";
	$additive?: "replace" | "sum";
	$alignmentBaseline?: "auto" | "baseline" | "before-edge" | "text-before-edge" | "middle" | "central" | "after-edge" |
	"text-after-edge" | "ideographic" | "alphabetic" | "hanging" | "mathematical" | "inherit";
	$allowReorder?: "no" | "yes";
	$alphabetic?: number | string;
	$amplitude?: number | string;
	$arabicForm?: "initial" | "medial" | "terminal" | "isolated";
	$ascent?: number | string;
	$attributeName?: string;
	$attributeType?: string;
	$autoReverse?: boolean;
	$azimuth?: number | string;
	$baseFrequency?: number | string;
	$baselineShift?: number | string;
	$baseProfile?: number | string;
	$bbox?: number | string;
	$begin?: number | string;
	$bias?: number | string;
	$by?: number | string;
	$calcMode?: number | string;
	$capHeight?: number | string;
	$clip?: number | string;
	$clipPath?: string;
	$clipPathUnits?: number | string;
	$clipRule?: number | string;
	$colorInterpolation?: number | string;
	$colorInterpolationFilters?: "auto" | "sRGB" | "linearRGB" | "inherit";
	$colorProfile?: number | string;
	$colorRendering?: number | string;
	$contentScriptType?: number | string;
	$contentStyleType?: number | string;
	$cursor?: number | string;
	$cx?: number | string;
	$cy?: number | string;
	$d?: string;
	$decelerate?: number | string;
	$descent?: number | string;
	$diffuseConstant?: number | string;
	$direction?: number | string;
	$display?: number | string;
	$divisor?: number | string;
	$dominantBaseline?: number | string;
	$dur?: number | string;
	$dx?: number | string;
	$dy?: number | string;
	$edgeMode?: number | string;
	$elevation?: number | string;
	$enableBackground?: number | string;
	$end?: number | string;
	$exponent?: number | string;
	$externalResourcesRequired?: boolean;
	$fill?: string;
	$fillOpacity?: number | string;
	$fillRule?: "nonzero" | "evenodd" | "inherit";
	$filter?: string;
	$filterRes?: number | string;
	$filterUnits?: number | string;
	$floodColor?: number | string;
	$floodOpacity?: number | string;
	$focusable?: boolean | "auto";
	$fontFamily?: string;
	$fontSize?: number | string;
	$fontSizeAdjust?: number | string;
	$fontStretch?: number | string;
	$fontStyle?: number | string;
	$fontVariant?: number | string;
	$fontWeight?: number | string;
	$format?: number | string;
	$from?: number | string;
	$fx?: number | string;
	$fy?: number | string;
	$g1?: number | string;
	$g2?: number | string;
	$glyphName?: number | string;
	$glyphOrientationHorizontal?: number | string;
	$glyphOrientationVertical?: number | string;
	$glyphRef?: number | string;
	$gradientTransform?: string;
	$gradientUnits?: string;
	$hanging?: number | string;
	$horizAdvX?: number | string;
	$horizOriginX?: number | string;
	$href?: string;
	$ideographic?: number | string;
	$imageRendering?: number | string;
	$in2?: number | string;
	$in?: string;
	$intercept?: number | string;
	$k1?: number | string;
	$k2?: number | string;
	$k3?: number | string;
	$k4?: number | string;
	$k?: number | string;
	$kernelMatrix?: number | string;
	$kernelUnitLength?: number | string;
	$kerning?: number | string;
	$keyPoints?: number | string;
	$keySplines?: number | string;
	$keyTimes?: number | string;
	$lengthAdjust?: number | string;
	$letterSpacing?: number | string;
	$lightingColor?: number | string;
	$limitingConeAngle?: number | string;
	$local?: number | string;
	$markerEnd?: string;
	$markerHeight?: number | string;
	$markerMid?: string;
	$markerStart?: string;
	$markerUnits?: number | string;
	$markerWidth?: number | string;
	$mask?: string;
	$maskContentUnits?: number | string;
	$maskUnits?: number | string;
	$mathematical?: number | string;
	$mode?: number | string;
	$numOctaves?: number | string;
	$offset?: number | string;
	$opacity?: number | string;
	$operator?: number | string;
	$order?: number | string;
	$orient?: number | string;
	$orientation?: number | string;
	$origin?: number | string;
	$overflow?: number | string;
	$overlinePosition?: number | string;
	$overlineThickness?: number | string;
	$paintOrder?: number | string;
	$panose1?: number | string;
	$path?: string;
	$pathLength?: number | string;
	$patternContentUnits?: string;
	$patternTransform?: number | string;
	$patternUnits?: string;
	$pointerEvents?: number | string;
	$points?: string;
	$pointsAtX?: number | string;
	$pointsAtY?: number | string;
	$pointsAtZ?: number | string;
	$preserveAlpha?: boolean;
	$preserveAspectRatio?: string;
	$primitiveUnits?: number | string;
	$r?: number | string;
	$radius?: number | string;
	$refX?: number | string;
	$refY?: number | string;
	$renderingIntent?: number | string;
	$repeatCount?: number | string;
	$repeatDur?: number | string;
	$requiredExtensions?: number | string;
	$requiredFeatures?: number | string;
	$restart?: number | string;
	$result?: string;
	$rotate?: number | string;
	$rx?: number | string;
	$ry?: number | string;
	$scale?: number | string;
	$seed?: number | string;
	$shapeRendering?: number | string;
	$slope?: number | string;
	$spacing?: number | string;
	$specularConstant?: number | string;
	$specularExponent?: number | string;
	$speed?: number | string;
	$spreadMethod?: string;
	$startOffset?: number | string;
	$stdDeviation?: number | string;
	$stemh?: number | string;
	$stemv?: number | string;
	$stitchTiles?: number | string;
	$stopColor?: string;
	$stopOpacity?: number | string;
	$strikethroughPosition?: number | string;
	$strikethroughThickness?: number | string;
	$string?: number | string;
	$stroke?: string;
	$strokeDasharray?: string | number;
	$strokeDashoffset?: string | number;
	$strokeLinecap?: "butt" | "round" | "square" | "inherit";
	$strokeLinejoin?: "miter" | "round" | "bevel" | "inherit";
	$strokeMiterlimit?: number | string;
	$strokeOpacity?: number | string;
	$strokeWidth?: number | string;
	$surfaceScale?: number | string;
	$systemLanguage?: number | string;
	$tableValues?: number | string;
	$targetX?: number | string;
	$targetY?: number | string;
	$textAnchor?: string;
	$textDecoration?: number | string;
	$textLength?: number | string;
	$textRendering?: number | string;
	$to?: number | string;
	$transform?: string;
	$u1?: number | string;
	$u2?: number | string;
	$underlinePosition?: number | string;
	$underlineThickness?: number | string;
	$unicode?: number | string;
	$unicodeBidi?: number | string;
	$unicodeRange?: number | string;
	$unitsPerEm?: number | string;
	$vAlphabetic?: number | string;
	$values?: string;
	$vectorEffect?: number | string;
	$version?: string;
	$vertAdvY?: number | string;
	$vertOriginX?: number | string;
	$vertOriginY?: number | string;
	$vHanging?: number | string;
	$vIdeographic?: number | string;
	$viewBox?: string;
	$viewTarget?: number | string;
	$visibility?: number | string;
	$vMathematical?: number | string;
	$widths?: number | string;
	$wordSpacing?: number | string;
	$writingMode?: number | string;
	$x1?: number | string;
	$x2?: number | string;
	$x?: number | string;
	$xChannelSelector?: string;
	$xHeight?: number | string;
	$xlinkActuate?: string;
	$xlinkArcrole?: string;
	$xlinkHref?: string;
	$xlinkRole?: string;
	$xlinkShow?: string;
	$xlinkTitle?: string;
	$xlinkType?: string;
	$xmlBase?: string;
	$xmlLang?: string;
	$xmlns?: string;
	$xmlnsXlink?: string;
	$xmlSpace?: string;
	$y1?: number | string;
	$y2?: number | string;
	$y?: number | string;
	$yChannelSelector?: string;
	$z?: number | string;
	$zoomAndPan?: string;
}

export interface WebViewHTMLAttributes extends HTMLAttributes {
	allowFullScreen?: boolean;
	allowpopups?: boolean;
	autoFocus?: boolean;
	autosize?: boolean;
	blinkfeatures?: string;
	disableblinkfeatures?: string;
	disableguestresize?: boolean;
	disablewebsecurity?: boolean;
	guestinstance?: string;
	httpreferrer?: string;
	nodeintegration?: boolean;
	partition?: string;
	plugins?: boolean;
	preload?: string;
	src?: string;
	useragent?: string;
	webpreferences?: string;

	// binding
	$allowFullScreen?: boolean;
	$allowpopups?: boolean;
	$autoFocus?: boolean;
	$autosize?: boolean;
	$blinkfeatures?: string;
	$disableblinkfeatures?: string;
	$disableguestresize?: boolean;
	$disablewebsecurity?: boolean;
	$guestinstance?: string;
	$httpreferrer?: string;
	$nodeintegration?: boolean;
	$partition?: string;
	$plugins?: boolean;
	$preload?: string;
	$src?: string;
	$useragent?: string;
	$webpreferences?: string;
}

declare global {
	export namespace JSX {
		interface IntrinsicElements {

			// html
			a: AttrMap<AnchorHTMLAttributes>;
			abbr: AttrMap<HTMLAttributes>;
			address: AttrMap<HTMLAttributes>;
			area: AttrMap<AreaHTMLAttributes>;
			article: AttrMap<HTMLAttributes>;
			aside: AttrMap<HTMLAttributes>;
			audio: AttrMap<AudioHTMLAttributes>;
			b: AttrMap<HTMLAttributes>;
			base: AttrMap<BaseHTMLAttributes>;
			bdi: AttrMap<HTMLAttributes>;
			bdo: AttrMap<HTMLAttributes>;
			big: AttrMap<HTMLAttributes>;
			blockquote: AttrMap<BlockquoteHTMLAttributes>;
			body: AttrMap<HTMLAttributes>;
			br: AttrMap<HTMLAttributes>;
			button: AttrMap<ButtonHTMLAttributes>;
			canvas: AttrMap<CanvasHTMLAttributes>;
			caption: AttrMap<HTMLAttributes>;
			cite: AttrMap<HTMLAttributes>;
			code: AttrMap<HTMLAttributes>;
			col: AttrMap<ColHTMLAttributes>;
			colgroup: AttrMap<ColgroupHTMLAttributes>;
			data: AttrMap<DataHTMLAttributes>;
			datalist: AttrMap<HTMLAttributes>;
			dd: AttrMap<HTMLAttributes>;
			del: AttrMap<DelHTMLAttributes>;
			details: AttrMap<DetailsHTMLAttributes>;
			dfn: AttrMap<HTMLAttributes>;
			dialog: AttrMap<DialogHTMLAttributes>;
			div: AttrMap<HTMLAttributes>;
			dl: AttrMap<HTMLAttributes>;
			dt: AttrMap<HTMLAttributes>;
			em: AttrMap<HTMLAttributes>;
			embed: AttrMap<EmbedHTMLAttributes>;
			fieldset: AttrMap<FieldsetHTMLAttributes>;
			figcaption: AttrMap<HTMLAttributes>;
			figure: AttrMap<HTMLAttributes>;
			footer: AttrMap<HTMLAttributes>;
			form: AttrMap<FormHTMLAttributes>;
			h1: AttrMap<HTMLAttributes>;
			h2: AttrMap<HTMLAttributes>;
			h3: AttrMap<HTMLAttributes>;
			h4: AttrMap<HTMLAttributes>;
			h5: AttrMap<HTMLAttributes>;
			h6: AttrMap<HTMLAttributes>;
			head: AttrMap<HTMLAttributes>;
			header: AttrMap<HTMLAttributes>;
			hgroup: AttrMap<HTMLAttributes>;
			hr: AttrMap<HTMLAttributes>;
			html: AttrMap<HtmlHTMLAttributes>;
			i: AttrMap<HTMLAttributes>;
			iframe: AttrMap<IframeHTMLAttributes>;
			img: AttrMap<ImgHTMLAttributes>;
			input: AttrMap<InputHTMLAttributes>;
			ins: AttrMap<InsHTMLAttributes>;
			kbd: AttrMap<HTMLAttributes>;
			keygen: AttrMap<KeygenHTMLAttributes>;
			label: AttrMap<LabelHTMLAttributes>;
			legend: AttrMap<HTMLAttributes>;
			li: AttrMap<LiHTMLAttributes>;
			link: AttrMap<LinkHTMLAttributes>;
			main: AttrMap<HTMLAttributes>;
			map: AttrMap<MapHTMLAttributes>;
			mark: AttrMap<HTMLAttributes>;
			menu: AttrMap<MenuHTMLAttributes>;
			menuitem: AttrMap<HTMLAttributes>;
			meta: AttrMap<MetaHTMLAttributes>;
			meter: AttrMap<MeterHTMLAttributes>;
			nav: AttrMap<HTMLAttributes>;
			noscript: AttrMap<HTMLAttributes>;
			object: AttrMap<ObjectHTMLAttributes>;
			ol: AttrMap<OlHTMLAttributes>;
			optgroup: AttrMap<OptgroupHTMLAttributes>;
			option: AttrMap<OptionHTMLAttributes>;
			output: AttrMap<OutputHTMLAttributes>;
			p: AttrMap<HTMLAttributes>;
			param: AttrMap<ParamHTMLAttributes>;
			picture: AttrMap<HTMLAttributes>;
			pre: AttrMap<HTMLAttributes>;
			progress: AttrMap<ProgressHTMLAttributes>;
			q: AttrMap<QuoteHTMLAttributes>;
			rp: AttrMap<HTMLAttributes>;
			rt: AttrMap<HTMLAttributes>;
			ruby: AttrMap<HTMLAttributes>;
			s: AttrMap<HTMLAttributes>;
			samp: AttrMap<HTMLAttributes>;
			slot: AttrMap<SlotHTMLAttributes>;
			script: AttrMap<ScriptHTMLAttributes>;
			section: AttrMap<HTMLAttributes>;
			select: AttrMap<SelectHTMLAttributes>;
			small: AttrMap<HTMLAttributes>;
			source: AttrMap<SourceHTMLAttributes>;
			span: AttrMap<HTMLAttributes>;
			strong: AttrMap<HTMLAttributes>;
			style: AttrMap<StyleHTMLAttributes>;
			sub: AttrMap<HTMLAttributes>;
			summary: AttrMap<HTMLAttributes>;
			sup: AttrMap<HTMLAttributes>;
			table: AttrMap<TableHTMLAttributes>;
			template: AttrMap<HTMLAttributes>;
			tbody: AttrMap<HTMLAttributes>;
			td: AttrMap<TdHTMLAttributes>;
			textarea: AttrMap<TextareaHTMLAttributes>;
			tfoot: AttrMap<HTMLAttributes>;
			th: AttrMap<ThHTMLAttributes>;
			thead: AttrMap<HTMLAttributes>;
			time: AttrMap<TimeHTMLAttributes>;
			title: AttrMap<HTMLAttributes>;
			tr: AttrMap<HTMLAttributes>;
			track: AttrMap<TrackHTMLAttributes>;
			u: AttrMap<HTMLAttributes>;
			ul: AttrMap<HTMLAttributes>;
			"var": AttrMap<HTMLAttributes>;
			video: AttrMap<VideoHTMLAttributes>;
			wbr: AttrMap<HTMLAttributes>;
			webview: AttrMap<WebViewHTMLAttributes>;

			// svg
			svg: AttrMap<SVGAttributes>;
			animate: AttrMap<SVGAttributes>;
			animateMotion: AttrMap<SVGAttributes>;
			animateTransform: AttrMap<SVGAttributes>;
			circle: AttrMap<SVGAttributes>;
			clipPath: AttrMap<SVGAttributes>;
			defs: AttrMap<SVGAttributes>;
			desc: AttrMap<SVGAttributes>;
			ellipse: AttrMap<SVGAttributes>;
			feBlend: AttrMap<SVGAttributes>;
			feColorMatrix: AttrMap<SVGAttributes>;
			feComponentTransfer: AttrMap<SVGAttributes>;
			feComposite: AttrMap<SVGAttributes>;
			feConvolveMatrix: AttrMap<SVGAttributes>;
			feDiffuseLighting: AttrMap<SVGAttributes>;
			feDisplacementMap: AttrMap<SVGAttributes>;
			feDistantLight: AttrMap<SVGAttributes>;
			feDropShadow: AttrMap<SVGAttributes>;
			feFlood: AttrMap<SVGAttributes>;
			feFuncA: AttrMap<SVGAttributes>;
			feFuncB: AttrMap<SVGAttributes>;
			feFuncG: AttrMap<SVGAttributes>;
			feFuncR: AttrMap<SVGAttributes>;
			feGaussianBlur: AttrMap<SVGAttributes>;
			feImage: AttrMap<SVGAttributes>;
			feMerge: AttrMap<SVGAttributes>;
			feMergeNode: AttrMap<SVGAttributes>;
			feMorphology: AttrMap<SVGAttributes>;
			feOffset: AttrMap<SVGAttributes>;
			fePointLight: AttrMap<SVGAttributes>;
			feSpecularLighting: AttrMap<SVGAttributes>;
			feSpotLight: AttrMap<SVGAttributes>;
			feTile: AttrMap<SVGAttributes>;
			feTurbulence: AttrMap<SVGAttributes>;
			filter: AttrMap<SVGAttributes>;
			foreignObject: AttrMap<SVGAttributes>;
			g: AttrMap<SVGAttributes>;
			image: AttrMap<SVGAttributes>;
			line: AttrMap<SVGAttributes>;
			linearGradient: AttrMap<SVGAttributes>;
			marker: AttrMap<SVGAttributes>;
			mask: AttrMap<SVGAttributes>;
			metadata: AttrMap<SVGAttributes>;
			mpath: AttrMap<SVGAttributes>;
			path: AttrMap<SVGAttributes>;
			pattern: AttrMap<SVGAttributes>;
			polygon: AttrMap<SVGAttributes>;
			polyline: AttrMap<SVGAttributes>;
			radialGradient: AttrMap<SVGAttributes>;
			rect: AttrMap<SVGAttributes>;
			stop: AttrMap<SVGAttributes>;
			switch: AttrMap<SVGAttributes>;
			symbol: AttrMap<SVGAttributes>;
			text: AttrMap<SVGAttributes>;
			textPath: AttrMap<SVGAttributes>;
			tspan: AttrMap<SVGAttributes>;
			use: AttrMap<SVGAttributes>;
			view: AttrMap<SVGAttributes>;


			// structural directives
			'if': IfProp;
			'for': ForProp | ForInProp | ForOfProp | ForAwaitOfProp;
			'while': WhileProp;

			'fragment': {};
			'comment': {};
			'directive': { name: string, paramter: string };
			[tagName: string]: HTMLAttributes & any;
		}
	}
}

export interface IfProp { condition: string | boolean; else?: string }
export interface ForProp { initialization?: string; condition: string | boolean; expression?: string }
export interface ForInProp { const: string; in: string, index?: string; trackBy?: string }
export interface ForOfProp { const: string; of: string, index?: string; trackBy?: string }
export interface ForAwaitOfProp { const: string; of: string, index?: string; trackBy?: string }
export interface WhileProp { condition: string | boolean }
