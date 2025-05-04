///////////////////////////////////////////////////////////////////////////////////////////////
// Int8
///////////////////////////////////////////////////////////////////////////////////////////////
export function readInt8(buffer: Uint8Array, offset: number) {
	const unsignedValue = buffer[offset]

	return (unsignedValue << 24) >> 24
}

export function writeInt8(buffer: Uint8Array, value: number, offset: number) {
	writeUint8(buffer, value, offset)
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Uint8
///////////////////////////////////////////////////////////////////////////////////////////////
export function readUint8(buffer: Uint8Array, offset: number) {
	return buffer[offset]
}

export function writeUint8(buffer: Uint8Array, value: number, offset: number) {
	buffer[offset] = value
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Int16LE
///////////////////////////////////////////////////////////////////////////////////////////////
export function readInt16LE(buffer: Uint8Array, offset: number) {
	const unsignedValue = readUint16LE(buffer, offset)

	return (unsignedValue << 16) >> 16
}

export function writeInt16LE(buffer: Uint8Array, value: number, offset: number) {
	writeUint16LE(buffer, value, offset)
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Uint16LE
///////////////////////////////////////////////////////////////////////////////////////////////
export function readUint16LE(buffer: Uint8Array, offset: number) {
	return (buffer[offset + 0]) | (buffer[offset + 1] << 8)
}

export function writeUint16LE(buffer: Uint8Array, value: number, offset: number) {
	buffer[offset + 0] = value
	buffer[offset + 1] = value >>> 8
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Int32LE
///////////////////////////////////////////////////////////////////////////////////////////////
export function readInt32LE(buffer: Uint8Array, offset: number) {
	const value =
		(buffer[offset + 0]) |
		(buffer[offset + 1] << 8) |
		(buffer[offset + 2] << 16) |
		(buffer[offset + 3] << 24)

	return value
}

export function writeInt32LE(buffer: Uint8Array, value: number, offset: number) {
	writeUint32LE(buffer, value, offset)
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Uint32LE
///////////////////////////////////////////////////////////////////////////////////////////////
export function readUint32LE(buffer: Uint8Array, offset: number) {
	return readInt32LE(buffer, offset) >>> 0
}

export function writeUint32LE(buffer: Uint8Array, value: number, offset: number) {
	buffer[offset + 0] = value
	buffer[offset + 1] = value >>> 8
	buffer[offset + 2] = value >>> 16
	buffer[offset + 3] = value >>> 24
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
