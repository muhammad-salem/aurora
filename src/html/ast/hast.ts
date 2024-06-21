import { RootContentMap } from 'hast';

declare module 'hast' {
	interface RootContentMap {
		raw: {
			name: string
		};
	}
}
