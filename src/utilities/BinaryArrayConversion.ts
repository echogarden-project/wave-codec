import { reverseByteGroupsIfBigEndian } from './Endianess.js'

////////////////////////////////////////////////////////////////////////////////////////////
// Int16Array <-> BytesLE
////////////////////////////////////////////////////////////////////////////////////////////
export function int16ArrayToBytesLE(int16s: Int16Array) {
	const bytes = new Uint8Array(int16s.buffer, int16s.byteOffset, int16s.byteLength)

	return reverseByteGroupsIfBigEndian(bytes, 2)
}

export function bytesLEToInt16Array(bytes: Uint8Array) {
	bytes = reverseByteGroupsIfBigEndian(bytes, 2)

	return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2)
}

////////////////////////////////////////////////////////////////////////////////////////////
// Int24Array <-> BytesLE (uses Int32Array for storage)
////////////////////////////////////////////////////////////////////////////////////////////
export function int24ArrayToBytesLE(int24s: Int32Array) {
	const bytes = new Uint8Array(int24s.length * 3)

	for (
		let readOffset = 0, writeOffset = 0;
		readOffset < int24s.length;
		readOffset += 1, writeOffset += 3) {

		const value = int24s[readOffset]

		bytes[writeOffset + 0] = value
		bytes[writeOffset + 1] = value >>> 8
		bytes[writeOffset + 2] = value >>> 16
	}

	return bytes
}

export function bytesLEToInt24Array(bytes: Uint8Array) {
	if (bytes.length % 3 !== 0) {
		throw new Error(`Bytes has a length of ${bytes.length}, which is not a multiple of 3`)
	}

	const int24s = new Int32Array(bytes.length / 3)

	for (
		let readOffset = 0, writeOffset = 0;
		readOffset < bytes.length;
		readOffset += 3, writeOffset += 1) {

		const unsignedValue =
			(bytes[readOffset + 0]) |
			(bytes[readOffset + 1] << 8) |
			(bytes[readOffset + 2] << 16)

		const signedValue = (unsignedValue << 8) >> 8

		int24s[writeOffset] = signedValue
	}

	return int24s
}

////////////////////////////////////////////////////////////////////////////////////////////
// Int32Array <-> BytesLE
////////////////////////////////////////////////////////////////////////////////////////////
export function int32ArrayToBytesLE(int32s: Int32Array) {
	const bytes = new Uint8Array(int32s.buffer, int32s.byteOffset, int32s.byteLength)

	return reverseByteGroupsIfBigEndian(bytes, 4)
}

export function bytesLEToInt32Array(bytes: Uint8Array) {
	bytes = reverseByteGroupsIfBigEndian(bytes, 4)

	return new Int32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
}

////////////////////////////////////////////////////////////////////////////////////////////
// Float32Array <-> BytesLE
////////////////////////////////////////////////////////////////////////////////////////////
export function float32ArrayToBytesLE(float32s: Float32Array) {
	const bytes = new Uint8Array(float32s.buffer, float32s.byteOffset, float32s.byteLength)

	return reverseByteGroupsIfBigEndian(bytes, 4)
}

export function bytesLEToFloat32Array(bytes: Uint8Array) {
	bytes = reverseByteGroupsIfBigEndian(bytes, 4)

	return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
}

////////////////////////////////////////////////////////////////////////////////////////////
// Float64Array <-> BytesLE
////////////////////////////////////////////////////////////////////////////////////////////
export function float64ArrayToBytesLE(float64s: Float64Array) {
	const bytes = new Uint8Array(float64s.buffer, float64s.byteOffset, float64s.byteLength)

	return reverseByteGroupsIfBigEndian(bytes, 8)
}

export function bytesLEToFloat64Array(bytes: Uint8Array) {
	bytes = reverseByteGroupsIfBigEndian(bytes, 8)

	return new Float64Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 8)
}

////////////////////////////////////////////////////////////////////////////////////////////
// Float64Array <-> Float32Array
////////////////////////////////////////////////////////////////////////////////////////////
export function float64ArrayTofloat32Array(float64s: Float64Array) {
	return Float32Array.from(float64s)
}

export function float32ArrayTofloat64Array(float32s: Float32Array) {
	return Float64Array.from(float32s)
}
