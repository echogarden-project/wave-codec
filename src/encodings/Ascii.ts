export function encodeAscii(asciiString: string) {
	const len = asciiString.length

	const buffer = new Uint8Array(len)

	for (let readOffset = 0; readOffset < len; readOffset++) {
		const charCode = asciiString.charCodeAt(readOffset)

		if (charCode >= 128) {
			throw new Error(`Character '${asciiString[readOffset]}' (code: ${charCode}) at offset ${readOffset} can't be encoded as a standard ASCII character`)
		}

		buffer[readOffset] = charCode
	}

	return buffer
}

export function decodeAscii(buffer: Uint8Array) {
	const maxChunkSize = 2 ** 24

	const decoder = new ChunkedAsciiDecoder()

	for (let readOffset = 0; readOffset < buffer.length; readOffset += maxChunkSize) {
		const chunk = buffer.subarray(readOffset, readOffset + maxChunkSize)

		decoder.writeChunk(chunk)
	}

	return decoder.toString()
}

export class ChunkedAsciiDecoder {
	private str = ''
	private readonly textDecoder = new TextDecoder('windows-1252')

	writeChunk(chunk: Uint8Array) {
		const decodedChunk = this.textDecoder.decode(chunk)

		this.str += decodedChunk
	}

	toString() {
		return this.str
	}
}
