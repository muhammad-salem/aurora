import { OnDestroy, OnInit } from '../component/lifecycle.js';

export interface RenderHandler extends Partial<OnInit>, Partial<OnDestroy> {

	/**
	 * execute when element attached to parent from ui
	 */
	onConnect?(): void;

	/**
	 * execute when element disconnected from ui
	 */
	onDisconnect?(): void;

}
