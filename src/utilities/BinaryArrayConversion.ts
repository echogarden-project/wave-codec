import { reverseByteGroupsIfBigEndian } from "./BinaryUtilities.js"

////////////////////////////////////////////////////////////////////////////////////////////
// int8 <-> bytesLE
////////////////////////////////////////////////////////////////////////////////////////////
export function int8ToBytes(int8s: Int8Array) {
	return new Uint8Array(int8s.buffer, int8s.byteOffset, int8s.byteLength)
}

export function bytesToInt8(bytes: Uint8Array) {
	return new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}

////////////////////////////////////////////////////////////////////////////////////////////
// int16 <-> bytesLE
////////////////////////////////////////////////////////////////////////////////////////////
export function int16ToBytesLE(int16s: Int16Array) {
	const bytes = new Uint8Array(int16s.buffer, int16s.byteOffset, int16s.byteLength)

	return reverseByteGroupsIfBigEndian(bytes, 2)
}

export function bytesLEToInt16(bytes: Uint8Array) {
	bytes = reverseByteGroupsIfBigEndian(bytes, 2)

	return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2)
}

////////////////////////////////////////////////////////////////////////////////////////////
// int24 <-> bytesLE (uses int32 for storage)
////////////////////////////////////////////////////////////////////////////////////////////
export function int24ToBytesLE(int24s: Int32Array) {
	const bytes = new Uint8Array(int24s.length * 3)

	let readOffset = 0
	let writeOffset = 0

	while (readOffset < int24s.length) {
		const signedValue = int24s[readOffset++]

		let unsignedValue: number

		if (signedValue >= 0) {
			unsignedValue = signedValue
		} else {
			unsignedValue = signedValue + (2 ** 24)
		}

		bytes[writeOffset++] = (unsignedValue) & 0xff
		bytes[writeOffset++] = (unsignedValue >> 8) & 0xff
		bytes[writeOffset++] = (unsignedValue >> 16) & 0xff
	}

	return bytes
}

export function bytesLEToInt24(bytes: Uint8Array) {
	if (bytes.length % 3 !== 0) {
		throw new Error(`Bytes has a length of ${bytes.length}, which is not a multiple of 3`)
	}

	const result = new Int32Array(bytes.length / 3)

	let readOffset = 0
	let writeOffset = 0

	while (writeOffset < result.length) {
		const b0 = bytes[readOffset++]
		const b1 = bytes[readOffset++]
		const b2 = bytes[readOffset++]

		const unsignedValue = (b0) | (b1 << 8) | (b2 << 16)

		let signedValue: number

		if (unsignedValue < 2 ** 23) {
			signedValue = unsignedValue
		} else {
			signedValue = unsignedValue - (2 ** 24)
		}

		result[writeOffset++] = signedValue
	}

	return result
}

////////////////////////////////////////////////////////////////////////////////////////////
// int32 <-> bytesLE
////////////////////////////////////////////////////////////////////////////////////////////
export function int32ToBytesLE(int32s: Int32Array) {
	const bytes = new Uint8Array(int32s.buffer, int32s.byteOffset, int32s.byteLength)

	return reverseByteGroupsIfBigEndian(bytes, 4)
}


export function bytesLEToInt32(bytes: Uint8Array) {
	bytes = reverseByteGroupsIfBigEndian(bytes, 4)

	return new Int32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
}

////////////////////////////////////////////////////////////////////////////////////////////
// float32 <-> bytesLE
////////////////////////////////////////////////////////////////////////////////////////////
export function float32ToBytesLE(float32s: Float32Array) {
	const bytes = new Uint8Array(float32s.buffer, float32s.byteOffset, float32s.byteLength)

	return reverseByteGroupsIfBigEndian(bytes, 4)
}

export function bytesLEToFloat32(bytes: Uint8Array) {
	bytes = reverseByteGroupsIfBigEndian(bytes, 4)

	return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
}

////////////////////////////////////////////////////////////////////////////////////////////
// float64 <-> bytesLE
////////////////////////////////////////////////////////////////////////////////////////////
export function float64ToBytesLE(float64s: Float64Array) {
	const bytes = new Uint8Array(float64s.buffer, float64s.byteOffset, float64s.byteLength)

	return reverseByteGroupsIfBigEndian(bytes, 8)
}

export function bytesLEToFloat64(bytes: Uint8Array) {
	bytes = reverseByteGroupsIfBigEndian(bytes, 8)

	return new Float64Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 8)
}

////////////////////////////////////////////////////////////////////////////////////////////
// float64 <-> float32
////////////////////////////////////////////////////////////////////////////////////////////
export function float64Tofloat32(float64s: Float64Array) {
	return Float32Array.from(float64s)
}

export function float32Tofloat64(float32s: Float32Array) {
	return Float64Array.from(float32s)
}
