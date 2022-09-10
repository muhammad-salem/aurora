export type AriaDropEffect = 'copy' | 'execute' | 'link' | 'move' | 'none' | 'popup';

export type AriaGrabbed = boolean | undefined;

export interface DragAndDropModel {
	ariaDropEffect: AriaDropEffect,
	ariaGrabbed: AriaGrabbed,
}

export const DragAndDropAttributes = [
	'aria-dropeffect',
	'aria-grabbed',
];

export const DragAndDropAttributesMap = {
	'aria-dropeffect': 'ariaDropEffect',
	'aria-grabbed': 'ariaGrabbed',
};
