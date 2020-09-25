
/**
 * value and html are alias for the same content as the default, they should be equals.
 */
declare module '*.html' {
    export const promise: Promise<string>;
    export const html: string;
    export const value: string;
    export default value;
}

/**
 * value, style and css are alias for the same content as the default, they should be equals.
 */
declare module '*.css' {
    export const promise: Promise<string>;
    export const css: string;
    export const style: string;
    export const value: string;
    export default value;
}

/**
 * value, text and txt are alias for the same content as the default, they should be equals.
 */
declare module '*.txt' {
    export const promise: Promise<string>;
    export const txt: string;
    export const text: string;
    export const value: string;
    export default value;
}

/**
 * value and json are alias for the same content as the default, they should be equals.
 */
declare module '*.json' {
    export const promise: Promise<{ [key: string]: any }>;
    export const json: { [key: string]: any };
    export const value: { [key: string]: any };
    export default value;
}

declare module '*.formData' {
    export const promise: Promise<FormData>;
    export const formData: FormData;
    export const value: FormData;
    export default value;
}

declare module '*.blob' {
    export const promise: Promise<Blob>;
    export const blob: Blob;
    export const value: Blob;
    export default value;
}

declare module '*.buf' {
    export const promise: Promise<Uint8Array>;
    export const value: Uint8Array;
    export default value;
}

declare module '*.buff' {
    export const promise: Promise<ArrayBuffer>;
    export const blob: ArrayBuffer;
    export const value: ArrayBuffer;
    export default value;
}


declare module '*.b64' {
    export const promise: Promise<string>;
    export const value: string;
    export default value;
}

/**
 * value and apng are alias for the same content as the default, they should be equals.
 */
declare module "*.apng" {
    export const promise: Promise<string>;
    export const apng: string;
    export const value: string;
    export default value;
}

/**
 * value and bmp are alias for the same content as the default, they should be equals.
 */
declare module "*.bmp" {
    export const promise: Promise<string>;
    export const bmp: string;
    export const value: string;
    export default value;
}

/**
 * value and gif are alias for the same content as the default, they should be equals.
 */
declare module "*.gif" {
    export const promise: Promise<string>;
    export const gif: string;
    export const value: string;
    export default value;
}

/**
 * value and ico are alias for the same content as the default, they should be equals.
 */
declare module "*.ico" {
    export const promise: Promise<string>;
    export const ico: string;
    export const value: string;
    export default value;
}

/**
 * value and cur are alias for the same content as the default, they should be equals.
 */
declare module "*.cur" {
    export const promise: Promise<string>;
    export const cur: string;
    export const value: string;
    export default value;
}

/**
 * value and jpg are alias for the same content as the default, they should be equals.
 */
declare module "*.jpg" {
    export const promise: Promise<string>;
    export const jpg: string;
    export const value: string;
    export default value;
}

/**
 * value and jpeg are alias for the same content as the default, they should be equals.
 */
declare module "*.jpeg" {
    export const promise: Promise<string>;
    export const jpeg: string;
    export const value: string;
    export default value;
}

/**
 * value and jfif are alias for the same content as the default, they should be equals.
 */
declare module "*.jfif" {
    export const promise: Promise<string>;
    export const jfif: string;
    export const value: string;
    export default value;
}

/**
 * value and pjpeg are alias for the same content as the default, they should be equals.
 */
declare module "*.pjpeg" {
    export const promise: Promise<string>;
    export const pjpeg: string;
    export const value: string;
    export default value;
}

/**
 * value and pjp are alias for the same content as the default, they should be equals.
 */
declare module "*.pjp" {
    export const promise: Promise<string>;
    export const pjp: string;
    export const value: string;
    export default value;
}

/**
 * value and png are alias for the same content as the default, they should be equals.
 */
declare module "*.png" {
    export const promise: Promise<string>;
    export const png: string;
    export const value: string;
    export default value;
}

/**
 * value and svg are alias for the same content as the default, they should be equals.
 */
declare module "*.svg" {
    export const promise: Promise<string>;
    export const svg: string;
    export const value: string;
    export default value;
}

/**
 * value and tif are alias for the same content as the default, they should be equals.
 */
declare module "*.tif" {
    export const promise: Promise<string>;
    export const tif: string;
    export const value: string;
    export default value;
}

/**
 * value and tiff are alias for the same content as the default, they should be equals.
 */
declare module "*.tiff" {
    export const promise: Promise<string>;
    export const tiff: string;
    export const value: string;
    export default value;
}

/**
 * value and webp are alias for the same content as the default, they should be equals.
 */
declare module "*.webp" {
    export const promise: Promise<string>;
    export const webp: string;
    export const value: string;
    export default value;
}

// audio extension

declare module "*.3gp" {
    export const promise: Promise<AudioBufferSourceNode>;
    export const tgp: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.flac" {
    export const promise: Promise<AudioBufferSourceNode>;
    export const flac: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.mpg" {
    export const promise: Promise<AudioBufferSourceNode>;
    export const mpg: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.mpeg" {
    export const promise: Promise<AudioBufferSourceNode>;
    export const mpg: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.mp3" {
    export const promise: Promise<AudioBufferSourceNode>;
    export const mp3: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.mp4" {
    export const promise: Promise<AudioBufferSourceNode>;
    export const mp4: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.m4a" {
    export const promise: Promise<AudioBufferSourceNode>;
    export const m4a: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.oga" {
    export const promise: Promise<AudioBufferSourceNode>;
    export const oga: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.ogg" {
    export const promise: Promise<AudioBufferSourceNode>;
    export const ogg: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.wav" {
    export const promise: Promise<AudioBufferSourceNode>;
    export const wav: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.webm" {
    export const promise: Promise<AudioBufferSourceNode>;
    export const webm: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}
