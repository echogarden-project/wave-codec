import { encodeAlaw, decodeAlaw } from '../codecs/Alaw.js'
import { encodeMulaw, decodeMulaw } from '../codecs/Mulaw.js'

import * as BinaryArrayConversion from '../utilities/BinaryArrayConversion.js'
import { BitDepth, SampleFormat } from '../WaveFormatHeader.js'

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
			return BinaryArrayConversion.int16ToBytesLE(float32ToInt16Pcm(interleavedChannels))
		} else if (targetBitDepth === 24) {
			return BinaryArrayConversion.int24ToBytesLE(float32ToInt24Pcm(interleavedChannels))
		} else if (targetBitDepth === 32) {
			return BinaryArrayConversion.int32ToBytesLE(float32ToInt32Pcm(interleavedChannels))
		} else {
			throw new Error(`Unsupported PCM bit depth: ${targetBitDepth}`)
		}
	} else if (targetSampleFormat === SampleFormat.Float) {
		if (targetBitDepth === 32) {
			return BinaryArrayConversion.float32ToBytesLE(interleavedChannels)
		} else if (targetBitDepth === 64) {
			return BinaryArrayConversion.float64ToBytesLE(BinaryArrayConversion.float32Tofloat64(interleavedChannels))
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
			interleavedChannels = int16PcmToFloat32(BinaryArrayConversion.bytesLEToInt16(audioBuffer))
		} else if (sourceBitDepth === 24) {
			interleavedChannels = int24PcmToFloat32(BinaryArrayConversion.bytesLEToInt24(audioBuffer))
		} else if (sourceBitDepth === 32) {
			interleavedChannels = int32PcmToFloat32(BinaryArrayConversion.bytesLEToInt32(audioBuffer))
		} else {
			throw new Error(`Unsupported PCM bit depth: ${sourceBitDepth}`)
		}
	} else if (sourceSampleFormat === SampleFormat.Float) {
		if (sourceBitDepth === 32) {
			interleavedChannels = BinaryArrayConversion.bytesLEToFloat32(audioBuffer)
		} else if (sourceBitDepth === 64) {
			interleavedChannels = BinaryArrayConversion.float64Tofloat32(BinaryArrayConversion.bytesLEToFloat64(audioBuffer))
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

	return deInterleaveChannels(interleavedChannels, channelCount)
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Uint8 PCM <-> Float32 PCM conversion
/////////////////////////////////////////////////////////////////////////////////////////////
export function uint8PcmToFloat32(input: Uint8Array) {
	const sampleCount = input.length

	const output = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		output[i] = (input[i] - 128) / 128
	}

	return output
}

export function float32ToUint8Pcm(input: Float32Array) {
	const sampleCount = input.length

	const output = new Uint8Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		let int8Sample = input[i] * 128

		if (int8Sample < -128) {
			int8Sample = -128
		} else if (int8Sample > 127) {
			int8Sample = 127
		}

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
		output[i] = input[i] / 32768
	}

	return output
}

export function float32ToInt16Pcm(input: Float32Array) {
	const sampleCount = input.length

	const output = new Int16Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		const int16Sample = input[i] * 32768

		if (int16Sample < -32768) {
			output[i] = -32768
		} else if (int16Sample > 32767) {
			output[i] = 32767
		} else {
			output[i] = int16Sample
		}
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
		output[i] = input[i] / 8388608
	}

	return output
}

export function float32ToInt24Pcm(input: Float32Array) {
	const sampleCount = input.length

	const output = new Int32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		const int24Sample = input[i] * 8388608

		if (int24Sample < -8388608) {
			output[i] = -8388608
		} else if (int24Sample > 8388607) {
			output[i] = 8388607
		} else {
			output[i] = int24Sample
		}
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
		output[i] = input[i] / 2147483648
	}

	return output
}

export function float32ToInt32Pcm(input: Float32Array) {
	const sampleCount = input.length

	const output = new Int32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		const int32Sample = input[i] * 2147483648

		if (int32Sample < -2147483648) {
			output[i] = -2147483648
		} else if (int32Sample > 2147483647) {
			output[i] = 2147483647
		} else {
			output[i] = int32Sample
		}
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

export function deInterleaveChannels(interleavedChannels: Float32Array, channelCount: number) {
	if (channelCount === 0) {
		throw new Error('0 channel count received')
	}

	if (channelCount === 1) {
		return [interleavedChannels]
	}

	if (interleavedChannels.length % channelCount != 0) {
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
