import { readUint32LE, writeAscii, writeUint32LE } from './utilities/BinaryUtilities.js'
import { concatUint8Arrays } from './utilities/Utilities.js'
import { decodeAscii } from './encodings/Ascii.js'
import { WaveFormatHeader, BitDepth, SampleFormat } from './WaveFormatHeader.js'
import { bufferToFloat32Channels, float32ChannelsToBuffer } from './audio-utilities/AudioBufferConversion.js'

export function encodeWaveFromFloat32Channels(
	audioChannels: Float32Array[],
	sampleRate: number,
	bitDepth: BitDepth = 16,
	sampleFormat: SampleFormat = SampleFormat.PCM,
	speakerPositionMask = 0) {

	const audioDataBuffer = float32ChannelsToBuffer(audioChannels, bitDepth, sampleFormat)

	const resultWaveBuffer = encodeWaveFromBuffer(
		audioDataBuffer,
		sampleRate,
		audioChannels.length,
		bitDepth,
		sampleFormat,
		speakerPositionMask)

	return resultWaveBuffer
}

export function encodeWaveFromBuffer(
	audioBuffer: Uint8Array,
	sampleRate: number,
	channelCount: number,
	bitDepth: BitDepth,
	sampleFormat: SampleFormat,
	speakerPositionMask: number = 0) {

	// Create format subchunk
	const shouldUseExtensibleFormat = bitDepth > 16 || channelCount > 2

	const formatSubChunk = new WaveFormatHeader(channelCount, sampleRate, bitDepth, sampleFormat, speakerPositionMask)
	const formatSubChunkBuffer = formatSubChunk.serialize(shouldUseExtensibleFormat)

	// Create data subchunk
	const audioBufferLength = audioBuffer.length

	const dataSubChunkBuffer = new Uint8Array(4 + 4 + audioBufferLength)
	writeAscii(dataSubChunkBuffer, 'data', 0)

	let dataChunkLength = audioBufferLength

	// Ensure large data chunk length is clipped to the maximum of 4294967295 bytes
	if (dataChunkLength > 4294967295) {
		dataChunkLength = 4294967295
	}

	writeUint32LE(dataSubChunkBuffer, dataChunkLength, 4)

	dataSubChunkBuffer.set(audioBuffer, 8)

	// Create RIFF subchunk
	const riffChunkHeaderBuffer = new Uint8Array(12)
	writeAscii(riffChunkHeaderBuffer, 'RIFF', 0)

	let riffChunkLength = 4 + formatSubChunkBuffer.length + dataSubChunkBuffer.length

	// Ensure large RIFF chunk length is clipped to the maximum of 4294967295 bytes
	if (riffChunkLength > 4294967295) {
		riffChunkLength = 4294967295
	}

	writeUint32LE(riffChunkHeaderBuffer, riffChunkLength, 4)
	writeAscii(riffChunkHeaderBuffer, 'WAVE', 8)

	// Concatenate subchunks to produce the resulting wave buffer
	const resultWaveBuffer = concatUint8Arrays([riffChunkHeaderBuffer, formatSubChunkBuffer, dataSubChunkBuffer])

	return resultWaveBuffer
}

export function decodeWaveToFloat32Channels(
	waveData: Uint8Array,
	ignoreTruncatedChunks = true,
	ignoreOverflowingDataChunks = true) {

	const {
		decodedAudioBuffer,
		sampleRate,
		channelCount,
		bitDepth,
		sampleFormat,
		speakerPositionMask
	} = decodeWaveToBuffer(waveData, ignoreTruncatedChunks, ignoreOverflowingDataChunks)

	const audioChannels = bufferToFloat32Channels(
		decodedAudioBuffer,
		channelCount,
		bitDepth,
		sampleFormat)

	return {
		audioChannels,
		sampleRate
	} as RawAudio
}

export function decodeWaveToBuffer(
	waveData: Uint8Array,
	ignoreTruncatedChunks = true,
	ignoreOverflowingDataChunks = true) {

	let readOffset = 0

	const riffId = decodeAscii(waveData.subarray(readOffset, readOffset + 4))

	if (riffId !== 'RIFF') {
		throw new Error('Not a valid wave file. No RIFF id found at offset 0.')
	}

	readOffset += 4

	let riffChunkSize = readUint32LE(waveData, readOffset)

	readOffset += 4

	const waveId = decodeAscii(waveData.subarray(readOffset, readOffset + 4))

	if (waveId !== 'WAVE') {
		throw new Error('Not a valid wave file. No WAVE id found at offset 8.')
	}

	if (ignoreOverflowingDataChunks && riffChunkSize === 4294967295) {
		riffChunkSize = waveData.length - 8
	}

	if (riffChunkSize < waveData.length - 8) {
		throw new Error(`RIFF chunk length ${riffChunkSize} is smaller than the remaining size of the buffer (${waveData.length - 8})`)
	}

	if (!ignoreTruncatedChunks && riffChunkSize > waveData.length - 8) {
		throw new Error(`RIFF chunk length (${riffChunkSize}) is greater than the remaining size of the buffer (${waveData.length - 8})`)
	}

	readOffset += 4

	let formatSubChunkBodyBuffer: Uint8Array | undefined
	const dataBuffers: Uint8Array[] = []

	while (true) {
		const subChunkIdentifier = decodeAscii(waveData.subarray(readOffset, readOffset + 4))
		readOffset += 4

		let subChunkSize = readUint32LE(waveData, readOffset)
		readOffset += 4

		if (!ignoreTruncatedChunks && subChunkSize > waveData.length - readOffset) {
			throw new Error(`Encountered a '${subChunkIdentifier}' subchunk with a size of ${subChunkSize} which is greater than the remaining size of the buffer (${waveData.length - readOffset})`)
		}

		if (subChunkIdentifier === 'fmt ') {
			formatSubChunkBodyBuffer = waveData.subarray(readOffset, readOffset + subChunkSize)
		} else if (subChunkIdentifier === 'data') {
			if (!formatSubChunkBodyBuffer) {
				throw new Error('A data subchunk was encountered before a format subchunk')
			}

			// If the data chunk is truncated or extended beyond 4 GiB,
			// the data would be read up to the end of the buffer
			if (ignoreOverflowingDataChunks && subChunkSize === 4294967295) {
				subChunkSize = waveData.length - readOffset
			}

			const subChunkData = waveData.subarray(readOffset, readOffset + subChunkSize)

			dataBuffers.push(subChunkData)
		}

		// All sub chunks other than 'fmt ' and 'data' (e.g. 'LIST', 'fact', 'plst', 'junk' etc.) are ignored

		// This addition operation may overflow if JavaScript integers were 32 bits,
		// but since they are 52 bits, it is okay:
		readOffset += subChunkSize

		// Break if readOffset is equal to or is greater than the size of the buffer
		if (readOffset >= waveData.length) {
			break
		}
	}

	if (!formatSubChunkBodyBuffer) {
		throw new Error('No format subchunk was found in the wave file')
	}

	if (dataBuffers.length === 0) {
		throw new Error('No data subchunks were found in the wave file')
	}

	const waveFormat = WaveFormatHeader.deserializeFrom(formatSubChunkBodyBuffer)

	const sampleFormat = waveFormat.sampleFormat
	const channelCount = waveFormat.channelCount
	const sampleRate = waveFormat.sampleRate
	const bitDepth = waveFormat.bitDepth
	const speakerPositionMask = waveFormat.speakerPositionMask

	// Note: the returned audio buffer must be ensured to be
	// memory aligned to the target bit depth, like 2 bytes or 4 bytes for 16 and 32 bits.
	const decodedAudioBuffer = concatUint8Arrays(dataBuffers)

	return {
		decodedAudioBuffer,
		sampleRate,
		channelCount,
		bitDepth,
		sampleFormat,
		speakerPositionMask
	}
}

export function repairWaveData(waveData: Uint8Array) {
	const {
		decodedAudioBuffer,
		sampleRate,
		channelCount,
		bitDepth,
		sampleFormat,
		speakerPositionMask
	} = decodeWaveToBuffer(waveData, true, true)

	const reEncodedWaveData = encodeWaveFromBuffer(
		decodedAudioBuffer,
		sampleRate,
		channelCount,
		bitDepth,
		sampleFormat,
		speakerPositionMask)

	return reEncodedWaveData
}

export { float32ChannelsToBuffer, bufferToFloat32Channels } from './audio-utilities/AudioBufferConversion.js'

export { type BitDepth, type SampleFormat } from './WaveFormatHeader.js'

export type RawAudio = {
	audioChannels: Float32Array[]
	sampleRate: number
}
