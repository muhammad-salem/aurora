import { PropertyNode } from '@aurorats/expression';
import { createContextProviders } from '../context/context-provider.js';

export const WindowContextProvider = createContextProviders<Window>(window);

export const ThisNode = new PropertyNode('this');
