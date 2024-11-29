# WAVE encoder and decoder

Fully-featured encoder and decoder for the standard WAVE format.
* Written in pure TypeScript
* Supports all sample formats and bit-depths included in the WAVE standard, including GUID-based sub-formats for PCM and Float sample formats, and the 8-bit A-law and Mu-law codecs
* Ignores unsupported or unknown sub-chunks like `LIST`, `fact`, `plst` and `junk`
* Supports reading and writing WAVE buffers larger than 4 GiB, by interpreting a chunk of length 2^32 - 1 to extend up to the end of the buffer (even if it's much larger). This is compatible with FFMpeg's input and output approach for long or streaming WAVE data
* Runs on Node.js, Deno, Bun, browsers
* No dependencies

## Installation

```
npm install @echogarden/wave-codec
```

## Basic usage

Encodes and decodes raw audio data given as a channel array of 32-bit float samples:
```ts
import { encodeWaveFromFloat32Channels, decodeWaveToFloat32Channels } from '@echogarden/wave-codec'

// A stereo pair with a few silent samples
const float32Channels = [
	new Float32Array([0, 0, 0, 0]),
	new Float32Array([0, 0, 0, 0]),
]

const waveData = encodeWaveFromFloat32Channels(float32Channels, 44100)

const decodedChannels = decodeWaveToFloat32Channels(waveData)
```

## Encoding and decoding to and from a raw data buffer

The data is given as a `Uin8Array`, and may contain any sample format supported by the WAVE standard, like 8-bit 16-bit, 24-bit, 32-bit integer raw integer PCM, 32-bit or 64-bit float, Alaw or Mulaw. Multiple channels should be interleaved.
```ts
import { encodeWaveFromDataBuffer, decodeWaveToDataBuffer, SampleFormat } from '@echogarden/wave-codec'

const audioBuffer = new Uint8Array([0, 0, 0, 0])

const waveData = encodeWaveFromBuffer(
	audioBuffer, // Audio data
	44100, // Sample rate
	1, // Channel count
	16, // Bit depth, can be 8, 16, 24, or 32 for PCM, 32 or 64 for Float, 8 for Alaw and Mulaw
	SampleFormat.PCM, // Sample format, can be PCM, Float, Alaw or Mulaw
	0 // Speaker position mask (used for multichannel audio)
)

const {	decodedAudioBuffer,
		sampleRate,
		channelCount,
		bitDepth,
		sampleFormat,
		speakerPositionMask } = decodeWaveToBuffer(waveData)
```

## Converting between 32-bit float channels and data buffers

These methods are used internally to convert any supported sample format to and from 32-bit float channels, and are exposed as utility methods.

32-bit float channel array -> audio data buffer:
```ts
float32ChannelsToBuffer(
	audioChannels: Float32Array[],
	targetBitDepth: BitDepth = 16,
	targetSampleFormat: SampleFormat = SampleFormat.PCM): Uint8Array
```

Audio data buffer -> 32-bit float channel array:
```ts
bufferToFloat32Channels(
	audioBuffer: Uint8Array,
	channelCount: number,
	sourceBitDepth: BitDepth,
	sourceSampleFormat: SampleFormat): Float32Array[]
```

## License

MIT
