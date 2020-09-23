
/**
 * value and html are alias for the same content as the default, they should be equals.
 */
declare module '*.html' {
    export const html: string;
    export const value: string;
    export default value;
}

/**
 * value, style and css are alias for the same content as the default, they should be equals.
 */
declare module '*.css' {
    export const css: string;
    export const style: string;
    export const value: string;
    export default value;
}

/**
 * value, text and txt are alias for the same content as the default, they should be equals.
 */
declare module '*.txt' {
    export const txt: string;
    export const text: string;
    export const value: string;
    export default value;
}

/**
 * value and json are alias for the same content as the default, they should be equals.
 */
declare module '*.json' {
    export const json: { [key: string]: any };
    export const value: { [key: string]: any };
    export default value;
}

declare module '*.formData' {
    export const formData: FormData;
    export const value: FormData;
    export default value;
}

declare module '*.blob' {
    export const blob: Blob;
    export const value: Blob;
    export default value;
}

declare module '*.buf' {
    export const value: Uint8Array;
    export default value;
}

declare module '*.buff' {
    export const blob: ArrayBuffer;
    export const value: ArrayBuffer;
    export default value;
}


declare module '*.b64' {
    export const value: string;
    export default value;
}

/**
 * value and apng are alias for the same content as the default, they should be equals.
 */
declare module "*.apng" {
    export const apng: string;
    export const value: string;
    export default value;
}

/**
 * value and bmp are alias for the same content as the default, they should be equals.
 */
declare module "*.bmp" {
    export const bmp: string;
    export const value: string;
    export default value;
}

/**
 * value and gif are alias for the same content as the default, they should be equals.
 */
declare module "*.gif" {
    export const gif: string;
    export const value: string;
    export default value;
}

/**
 * value and ico are alias for the same content as the default, they should be equals.
 */
declare module "*.ico" {
    export const ico: string;
    export const value: string;
    export default value;
}

/**
 * value and cur are alias for the same content as the default, they should be equals.
 */
declare module "*.cur" {
    export const cur: string;
    export const value: string;
    export default value;
}

/**
 * value and jpg are alias for the same content as the default, they should be equals.
 */
declare module "*.jpg" {
    export const jpg: string;
    export const value: string;
    export default value;
}

/**
 * value and jpeg are alias for the same content as the default, they should be equals.
 */
declare module "*.jpeg" {
    export const jpeg: string;
    export const value: string;
    export default value;
}

/**
 * value and jfif are alias for the same content as the default, they should be equals.
 */
declare module "*.jfif" {
    export const jfif: string;
    export const value: string;
    export default value;
}

/**
 * value and pjpeg are alias for the same content as the default, they should be equals.
 */
declare module "*.pjpeg" {
    export const pjpeg: string;
    export const value: string;
    export default value;
}

/**
 * value and pjp are alias for the same content as the default, they should be equals.
 */
declare module "*.pjp" {
    export const pjp: string;
    export const value: string;
    export default value;
}

/**
 * value and png are alias for the same content as the default, they should be equals.
 */
declare module "*.png" {
    export const png: string;
    export const value: string;
    export default value;
}

/**
 * value and svg are alias for the same content as the default, they should be equals.
 */
declare module "*.svg" {
    export const svg: string;
    export const value: string;
    export default value;
}

/**
 * value and tif are alias for the same content as the default, they should be equals.
 */
declare module "*.tif" {
    export const tif: string;
    export const value: string;
    export default value;
}

/**
 * value and tiff are alias for the same content as the default, they should be equals.
 */
declare module "*.tiff" {
    export const tiff: string;
    export const value: string;
    export default value;
}

/**
 * value and webp are alias for the same content as the default, they should be equals.
 */
declare module "*.webp" {
    export const webp: string;
    export const value: string;
    export default value;
}

// audio extension

declare module "*.3gp" {
    export const tgp: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.flac" {
    export const flac: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.mpg" {
    export const mpg: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.mpeg" {
    export const mpg: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.mp3" {
    export const mp3: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.mp4" {
    export const mp4: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.m4a" {
    export const m4a: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.oga" {
    export const oga: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.ogg" {
    export const ogg: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.wav" {
    export const wav: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}

declare module "*.webm" {
    export const webm: AudioBufferSourceNode;
    export const value: AudioBufferSourceNode;
    export default value;
}
