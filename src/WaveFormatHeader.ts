import { readUint16LE, readUint32LE, writeAscii, writeUint16LE, writeUint32LE } from './utilities/BinaryUtilities.js'
import { encodeHex, decodeHex } from './encodings/Hex.js'

export class WaveFormatHeader { // 24 bytes total for PCM, 26 for float
	sampleFormat: SampleFormat // 2 bytes LE
	channelCount: number // 2 bytes LE
	sampleRate: number // 4 bytes LE
	get byteRate() { return this.sampleRate * this.bytesPerSample * this.channelCount } // 4 bytes LE
	get blockAlign() { return this.bytesPerSample * this.channelCount } // 2 bytes LE
	bitDepth: BitDepth // 2 bytes LE

	speakerPositionMask: number // 4 bytes LE
	get guid() { return sampleFormatToGuid[this.sampleFormat] } // 16 bytes BE

	// Helpers:
	get bytesPerSample() { return this.bitDepth / 8 }

	constructor(
		channelCount: number,
		sampleRate: number,
		bitDepth: BitDepth,
		sampleFormat: SampleFormat,
		speakerPositionMask = 0) {

		this.sampleFormat = sampleFormat
		this.channelCount = channelCount
		this.sampleRate = sampleRate
		this.bitDepth = bitDepth

		this.speakerPositionMask = speakerPositionMask
	}

	serialize(useExtensibleFormat: boolean) {
		let sampleFormatId = this.sampleFormat

		if (useExtensibleFormat) {
			sampleFormatId = 65534 as number
		}

		const serializedSize = sampleFormatToSerializedSize[sampleFormatId]

		const result = new Uint8Array(serializedSize)

		writeAscii(result, 'fmt ', 0) // + 4
		writeUint32LE(result, serializedSize - 8, 4) // + 4

		writeUint16LE(result, sampleFormatId, 8) // + 2
		writeUint16LE(result, this.channelCount, 10) // + 2
		writeUint32LE(result, this.sampleRate, 12) // + 4
		writeUint32LE(result, this.byteRate, 16) // + 4
		writeUint16LE(result, this.blockAlign, 20) // + 2
		writeUint16LE(result, this.bitDepth, 22) // + 2

		if (useExtensibleFormat) {
			writeUint16LE(result, serializedSize - 26, 24) // + 2 (extension size)
			writeUint16LE(result, this.bitDepth, 26) // + 2 (valid bits per sample)
			writeUint32LE(result, this.speakerPositionMask, 28) // + 2 (speaker position mask)

			if (this.guid) {
				result.set(decodeHex(this.guid), 32)
			} else {
				throw new Error(`Extensible format is not supported for sample format ${this.sampleFormat}`)
			}
		}

		return result
	}

	static deserializeFrom(formatChunkBody: Uint8Array) { // chunkBody should not include the first 8 bytes
		let sampleFormat = readUint16LE(formatChunkBody, 0) // + 2
		const channelCount = readUint16LE(formatChunkBody, 2) // + 2
		const sampleRate = readUint32LE(formatChunkBody, 4) // + 4
		const bitDepth = readUint16LE(formatChunkBody, 14)
		let speakerPositionMask = 0

		if (sampleFormat === 65534) {
			if (formatChunkBody.length < 40) {
				throw new Error(`Format subchunk specifies a format id of 65534 (extensible) but its body size is ${formatChunkBody.length} bytes, which is smaller than the minimum expected of 40 bytes`)
			}

			speakerPositionMask = readUint16LE(formatChunkBody, 20)

			const guid = encodeHex(formatChunkBody.subarray(24, 40))

			if (guid === sampleFormatToGuid[SampleFormat.PCM]) {
				sampleFormat = SampleFormat.PCM
			} else if (guid === sampleFormatToGuid[SampleFormat.Float]) {
				sampleFormat = SampleFormat.Float
			} else if (guid === sampleFormatToGuid[SampleFormat.Alaw]) {
				sampleFormat = SampleFormat.Alaw
			} else if (guid === sampleFormatToGuid[SampleFormat.Mulaw]) {
				sampleFormat = SampleFormat.Mulaw
			} else {
				throw new Error(`Unsupported format GUID in extended format subchunk: ${guid}`)
			}
		}

		if (sampleFormat === SampleFormat.PCM) {
			if (bitDepth !== 8 && bitDepth !== 16 && bitDepth !== 24 && bitDepth !== 32) {
				throw new Error(`PCM audio has a bit depth of ${bitDepth}, which is not supported`)
			}
		} else if (sampleFormat === SampleFormat.Float) {
			if (bitDepth !== 32 && bitDepth !== 64) {
				throw new Error(`IEEE float audio has a bit depth of ${bitDepth}, which is not supported`)
			}
		} else if (sampleFormat === SampleFormat.Alaw) {
			if (bitDepth !== 8) {
				throw new Error(`Alaw audio has a bit depth of ${bitDepth}, which is not supported`)
			}
		} else if (sampleFormat === SampleFormat.Mulaw) {
			if (bitDepth !== 8) {
				throw new Error(`Mulaw audio has a bit depth of ${bitDepth}, which is not supported`)
			}
		} else {
			throw new Error(`Wave audio format id ${sampleFormat} is not supported`)
		}

		return new WaveFormatHeader(channelCount, sampleRate, bitDepth, sampleFormat, speakerPositionMask)
	}
}

export enum SampleFormat {
	PCM = 1,
	Float = 3,
	Alaw = 6,
	Mulaw = 7,
}

export type BitDepth = 8 | 16 | 24 | 32 | 64

const sampleFormatToSerializedSize = {
	[SampleFormat.PCM]: 24,
	[SampleFormat.Float]: 26,
	[SampleFormat.Alaw]: 26,
	[SampleFormat.Mulaw]: 26,
	65534: 48
}

const sampleFormatToGuid = {
	[SampleFormat.PCM]: '0100000000001000800000aa00389b71',
	[SampleFormat.Float]: '0300000000001000800000aa00389b71',
	[SampleFormat.Alaw]: '0600000000001000800000aa00389b71',
	[SampleFormat.Mulaw]: '0700000000001000800000aa00389b71',
}
