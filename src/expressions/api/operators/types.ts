export interface EvaluateType {
	[key: string]: EvaluateCallback;
}

export interface EvaluateNode {
	left: any, right: any;
}

export type EvaluateCallback = (evalNode: EvaluateNode) => any;
