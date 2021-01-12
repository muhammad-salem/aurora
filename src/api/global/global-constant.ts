import { PropertyNode } from '@ibyar/expression';
import { ContextProviderImpl } from '../context/context-provider.js';

export const WINDOW_CONTEXT_PROVIDER = new ContextProviderImpl<Window>(window);

export const THIS_PROPERTY = new PropertyNode('this');

export const DUMMY_PROXY_TARGET = Object.create(null);
