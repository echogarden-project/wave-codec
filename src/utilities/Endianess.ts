///////////////////////////////////////////////////////////////////////////////////////////////
// Endianess
///////////////////////////////////////////////////////////////////////////////////////////////
export function reverseByteGroupsIfBigEndian(bytes: Uint8Array, groupSize: number): Uint8Array {
	if (isLittleEndianArch) {
		return bytes
	} else {
		return reverseByteGroups(bytes, groupSize)
	}
}

export function reverseByteGroups(bytes: Uint8Array, groupSize: number) {
	const result = bytes.slice()
	reverseByteGroupsInPlace(result, groupSize)

	return result
}

export function reverseByteGroupsInPlace(bytes: Uint8Array, groupSize: number) {
	if (bytes.length % groupSize !== 0) {
		throw new Error(`Byte count must be an integer multiple of the group size.`)
	}

	const halfGroupSize = Math.floor(groupSize / 2)

	for (let offset = 0; offset < bytes.length; offset += groupSize) {
		const groupFirstElementOffset = offset
		const groupLastElementOffset = offset + groupSize - 1

		for (let i = 0; i < halfGroupSize; i++) {
			const offset1 = groupFirstElementOffset + i
			const offset2 = groupLastElementOffset - i

			// Swap pair of bytes
			const valueAtOffset1 = bytes[offset1]
			bytes[offset1] = bytes[offset2]
			bytes[offset2] = valueAtOffset1
		}
	}
}

export const isLittleEndianArch = testIfLittleEndian()

function testIfLittleEndian() {
	const uint16Array = new Uint16Array([0x11_22])
	const bytes = new Uint8Array(uint16Array.buffer)

	return bytes[0] === 0x22
}
