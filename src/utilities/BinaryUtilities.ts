///////////////////////////////////////////////////////////////////////////////////////////////
// Int8
///////////////////////////////////////////////////////////////////////////////////////////////
export function readInt8(buffer: Uint8Array, offset: number) {
	const unsignedValue = buffer[offset]

	if (unsignedValue < 128) {
		return unsignedValue
	} else {
		return unsignedValue - 256
	}
}

export function writeInt8(buffer: Uint8Array, value: number, offset: number) {
	if (value < -128 || value > 127) {
		throw new Error(`Value ${value} is outside the range of an 8-bit signed integer`)
	}

	let unsignedValue: number

	if (value >= 0) {
		unsignedValue = value
	} else {
		unsignedValue = value + 256
	}

	buffer[offset] = unsignedValue
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Uint8
///////////////////////////////////////////////////////////////////////////////////////////////
export function readUint8(buffer: Uint8Array, offset: number) {
	return buffer[offset]
}

export function writeUint8(buffer: Uint8Array, value: number, offset: number) {
	if (value < 0 || value > 255) {
		throw new Error(`Value ${value} is outside the range of an 8-bit unsigned integer`)
	}

	buffer[offset] = value
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Int16LE
///////////////////////////////////////////////////////////////////////////////////////////////
export function readInt16LE(buffer: Uint8Array, offset: number) {
	const unsignedValue = readUint16LE(buffer, offset)

	if (unsignedValue < 32768) {
		return unsignedValue
	} else {
		return unsignedValue - 65536
	}
}

export function writeInt16LE(buffer: Uint8Array, value: number, offset: number) {
	if (value < -32768 || value > 32767) {
		throw new Error(`Value ${value} is outside the range of a 16-bit signed integer`)
	}

	let unsignedValue: number

	if (value >= 0) {
		unsignedValue = value
	} else {
		unsignedValue = value + 65536
	}

	writeUint16LE(buffer, unsignedValue, offset)
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Uint16LE
///////////////////////////////////////////////////////////////////////////////////////////////
export function readUint16LE(buffer: Uint8Array, offset: number) {
	return (buffer[offset]) | (buffer[offset + 1] << 8)
}

export function writeUint16LE(buffer: Uint8Array, value: number, offset: number) {
	if (value < 0 || value > 65535) {
		throw new Error(`Value ${value} is outside the range of a 16-bit unsigned integer`)
	}

	buffer[offset] = value & 0xff
	buffer[offset + 1] = (value >>> 8) & 0xff
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Int16LE
///////////////////////////////////////////////////////////////////////////////////////////////
export function readInt32LE(buffer: Uint8Array, offset: number) {
	const value =
		(buffer[offset]) |
		(buffer[offset + 1] << 8) |
		(buffer[offset + 2] << 16) |
		(buffer[offset + 3] << 24)

	return value
}

export function writeInt32LE(buffer: Uint8Array, value: number, offset: number) {
	if (value < -2147483648 || value > 2147483647) {
		throw new Error(`Value ${value} is outside the range of a 32-bit signed integer`)
	}

	buffer[offset] = value & 0xff
	buffer[offset + 1] = (value >> 8) & 0xff
	buffer[offset + 2] = (value >> 16) & 0xff
	buffer[offset + 3] = (value >> 24) & 0xff
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Uint32LE
///////////////////////////////////////////////////////////////////////////////////////////////
export function readUint32LE(buffer: Uint8Array, offset: number) {
	return readInt32LE(buffer, offset) >>> 0
}

export function writeUint32LE(buffer: Uint8Array, value: number, offset: number) {
	if (value < 0 || value > 4294967295) {
		throw new Error(`Value ${value} is outside the range of a 32-bit unsigned integer`)
	}

	buffer[offset] = value & 0xff
	buffer[offset + 1] = (value >>> 8) & 0xff
	buffer[offset + 2] = (value >>> 16) & 0xff
	buffer[offset + 3] = (value >>> 24) & 0xff
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Ascii
///////////////////////////////////////////////////////////////////////////////////////////////
export function writeAscii(buffer: Uint8Array, asciiString: string, writeStartOffset: number) {
	const writeEndOffset = Math.min(writeStartOffset + asciiString.length, buffer.length)

	let readOffset = 0
	let writeOffset = writeStartOffset

	while (writeOffset < writeEndOffset) {
		const charCode = asciiString.charCodeAt(readOffset++)

		if (charCode >= 128) {
			throw new Error(`Character '${asciiString[readOffset]}' (code: ${charCode}) at offset ${readOffset} can't be encoded as ASCII`)
		}

		buffer[writeOffset++] = charCode
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Endianess
///////////////////////////////////////////////////////////////////////////////////////////////
export function reverseByteGroupsIfBigEndian(bytes: Uint8Array, groupSize: number) {
	if (isBigEndianArch()) {
		return reverseByteGroups(bytes, groupSize)
	} else {
		return bytes
	}
}

export function reverseByteGroups(bytes: Uint8Array, groupSize: number) {
	if (bytes.length % groupSize !== 0) {
		throw new Error(`Byte count must be an integer multiple of the group size.`)
	}

	const groupEnd = groupSize - 1

	const result = new Uint8Array(bytes.length)
	let offset = 0

	while (offset < bytes.length) {
		for (let i = 0; i < groupSize; i++) {
			result[offset + i] = bytes[offset + (groupEnd - i)]
		}

		offset += groupSize
	}

	return result
}

let isBigEndianArch_cached: boolean | undefined
export function isBigEndianArch() {
	if (isBigEndianArch_cached === undefined) {
		const uint16Array = new Uint16Array([0x11_22])
		const byteView = new Uint8Array(uint16Array.buffer)

		isBigEndianArch_cached = byteView[0] === 0x11
	}

	return isBigEndianArch_cached
}
