import { encodeAlaw, decodeAlaw } from '../codecs/Alaw.js'
import { encodeMulaw, decodeMulaw } from '../codecs/Mulaw.js'

import * as BinaryArrayConversion from '../utilities/BinaryArrayConversion.js'
import { BitDepth, SampleFormat } from '../WaveFormatHeader.js'
import { clip } from '../utilities/Utilities.js'

/////////////////////////////////////////////////////////////////////////////////////////////
// Audio conversions to and from float32 PCM
/////////////////////////////////////////////////////////////////////////////////////////////
export function float32ChannelsToBuffer(audioChannels: Float32Array[], targetBitDepth: BitDepth = 16, targetSampleFormat: SampleFormat = SampleFormat.PCM): Uint8Array {
	const interleavedChannels = interleaveChannels(audioChannels)

	audioChannels = [] // Zero the array references to allow the GC to free up memory, if possible

	if (targetSampleFormat === SampleFormat.PCM) {
		if (targetBitDepth === 8) {
			return float32ToUint8Pcm(interleavedChannels)
		} else if (targetBitDepth === 16) {
			return BinaryArrayConversion.int16ArrayToBytesLE(float32ToInt16Pcm(interleavedChannels))
		} else if (targetBitDepth === 24) {
			return BinaryArrayConversion.int24ArrayToBytesLE(float32ToInt24Pcm(interleavedChannels))
		} else if (targetBitDepth === 32) {
			return BinaryArrayConversion.int32ArrayToBytesLE(float32ToInt32Pcm(interleavedChannels))
		} else {
			throw new Error(`Unsupported PCM bit depth: ${targetBitDepth}`)
		}
	} else if (targetSampleFormat === SampleFormat.Float) {
		if (targetBitDepth === 32) {
			return BinaryArrayConversion.float32ArrayToBytesLE(interleavedChannels)
		} else if (targetBitDepth === 64) {
			return BinaryArrayConversion.float64ArrayToBytesLE(BinaryArrayConversion.float32ArrayTofloat64Array(interleavedChannels))
		} else {
			throw new Error(`Unsupported float bit depth: ${targetBitDepth}`)
		}
	} else if (targetSampleFormat === SampleFormat.Alaw) {
		if (targetBitDepth === 8) {
			return encodeAlaw(float32ToInt16Pcm(interleavedChannels))
		} else {
			throw new Error(`Unsupported alaw bit depth: ${targetBitDepth}`)
		}
	} else if (targetSampleFormat === SampleFormat.Mulaw) {
		if (targetBitDepth === 8) {
			return encodeMulaw(float32ToInt16Pcm(interleavedChannels))
		} else {
			throw new Error(`Unsupported mulaw bit depth: ${targetBitDepth}`)
		}
	} else {
		throw new Error(`Unsupported audio format: ${targetSampleFormat}`)
	}
}

export function bufferToFloat32Channels(audioBuffer: Uint8Array, channelCount: number, sourceBitDepth: BitDepth, sourceSampleFormat: SampleFormat) {
	let interleavedChannels: Float32Array

	if (sourceSampleFormat === SampleFormat.PCM) {
		if (sourceBitDepth === 8) {
			interleavedChannels = uint8PcmToFloat32(audioBuffer)
		} else if (sourceBitDepth === 16) {
			interleavedChannels = int16PcmToFloat32(BinaryArrayConversion.bytesLEToInt16Array(audioBuffer))
		} else if (sourceBitDepth === 24) {
			interleavedChannels = int24PcmToFloat32(BinaryArrayConversion.bytesLEToInt24Array(audioBuffer))
		} else if (sourceBitDepth === 32) {
			interleavedChannels = int32PcmToFloat32(BinaryArrayConversion.bytesLEToInt32Array(audioBuffer))
		} else {
			throw new Error(`Unsupported PCM bit depth: ${sourceBitDepth}`)
		}
	} else if (sourceSampleFormat === SampleFormat.Float) {
		if (sourceBitDepth === 32) {
			interleavedChannels = BinaryArrayConversion.bytesLEToFloat32Array(audioBuffer)
		} else if (sourceBitDepth === 64) {
			interleavedChannels = BinaryArrayConversion.float64ArrayTofloat32Array(BinaryArrayConversion.bytesLEToFloat64Array(audioBuffer))
		} else {
			throw new Error(`Unsupported float bit depth: ${sourceBitDepth}`)
		}
	} else if (sourceSampleFormat === SampleFormat.Alaw) {
		if (sourceBitDepth === 8) {
			interleavedChannels = int16PcmToFloat32(decodeAlaw(audioBuffer))
		} else {
			throw new Error(`Unsupported alaw bit depth: ${sourceBitDepth}`)
		}
	} else if (sourceSampleFormat === SampleFormat.Mulaw) {
		if (sourceBitDepth === 8) {
			interleavedChannels = int16PcmToFloat32(decodeMulaw(audioBuffer))
		} else {
			throw new Error(`Unsupported mulaw bit depth: ${sourceBitDepth}`)
		}
	} else {
		throw new Error(`Unsupported audio format: ${sourceSampleFormat}`)
	}

	audioBuffer = new Uint8Array(0) // Zero the reference to allow the GC to free up memory, if possible

	return deinterleaveChannels(interleavedChannels, channelCount)
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Uint8 PCM <-> Float32 PCM conversion
/////////////////////////////////////////////////////////////////////////////////////////////
export function uint8PcmToFloat32(input: Uint8Array) {
	const sampleCount = input.length

	const output = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		output[i] = (input[i] - 128) * (1 / 128)
	}

	return output
}

export function float32ToUint8Pcm(input: Float32Array) {
	const sampleCount = input.length

	const output = new Uint8Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		let int8Sample = Math.round(input[i] * 128)

		int8Sample = clip(int8Sample, -128, 127)

		output[i] = int8Sample + 128
	}

	return output
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Float32 PCM <-> Int16 PCM conversion
/////////////////////////////////////////////////////////////////////////////////////////////
export function int16PcmToFloat32(input: Int16Array) {
	const sampleCount = input.length

	const output = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		output[i] = input[i] * (1 / 32768)
	}

	return output
}

export function float32ToInt16Pcm(input: Float32Array) {
	const sampleCount = input.length

	const output = new Int16Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		let int16Sample = Math.round(input[i] * 32768)

		int16Sample = clip(int16Sample, -32768, 32767)

		output[i] = int16Sample
	}

	return output
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Float32 PCM <-> Int24 PCM conversion (uses int32 for storage)
/////////////////////////////////////////////////////////////////////////////////////////////
export function int24PcmToFloat32(input: Int32Array) {
	const sampleCount = input.length

	const output = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		output[i] = input[i] * (1 / 8388608)
	}

	return output
}

export function float32ToInt24Pcm(input: Float32Array) {
	const sampleCount = input.length

	const output = new Int32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		let int24Sample = Math.round(input[i] * 8388608)

		int24Sample = clip(int24Sample, -8388608, 8388607)

		output[i] = int24Sample
	}

	return output
}
/////////////////////////////////////////////////////////////////////////////////////////////
// Float32 PCM <-> Int32 PCM conversion
/////////////////////////////////////////////////////////////////////////////////////////////
export function int32PcmToFloat32(input: Int32Array) {
	const sampleCount = input.length

	const output = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		output[i] = input[i] * (1 / 2147483648)
	}

	return output
}

export function float32ToInt32Pcm(input: Float32Array) {
	const sampleCount = input.length

	const output = new Int32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		let int32Sample = Math.round(input[i] * 2147483648)

		int32Sample = clip(int32Sample, -2147483648, 2147483647)

		output[i] = int32Sample
	}

	return output
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Channel interleaving and deinterleaving
/////////////////////////////////////////////////////////////////////////////////////////////
export function interleaveChannels(channels: Float32Array[]) {
	const channelCount = channels.length

	if (channelCount === 0) {
		throw new Error('Empty channel array received')
	}

	if (channelCount === 1) {
		return channels[0]
	}

	const sampleCount = channels[0].length
	const result = new Float32Array(sampleCount * channelCount)

	let writeIndex = 0

	for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
		for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
			result[writeIndex++] = channels[channelIndex][sampleIndex]
		}
	}

	return result
}

export function deinterleaveChannels(interleavedChannels: Float32Array, channelCount: number) {
	if (channelCount < 1) {
		throw new Error(`Invalid channel count of ${channelCount} received, which is smaller than 1`)
	}

	if (channelCount === 1) {
		return [interleavedChannels]
	}

	if (interleavedChannels.length % channelCount !== 0) {
		throw new Error(`Size of interleaved channels (${interleaveChannels.length}) is not a multiple of channel count (${channelCount})`)
	}

	const sampleCount = interleavedChannels.length / channelCount

	const channels: Float32Array[] = []

	for (let i = 0; i < channelCount; i++) {
		channels.push(new Float32Array(sampleCount))
	}

	let readIndex = 0

	for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
		for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
			channels[channelIndex][sampleIndex] = interleavedChannels[readIndex++]
		}
	}

	return channels
}
