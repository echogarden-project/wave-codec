import { decodeWaveToFloat32Channels, encodeWaveFromFloat32Channels, SampleFormat } from './WaveCodec.js'

function test() {
	const channel1 = new Float32Array([-0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3])
	const channel2 = new Float32Array([-0.2, -0.1, 0.0, 0.1, 0.2, 0.3, 0.4])
	const channel3 = new Float32Array([-0.1, 0.0, 0.1, 0.2, 0.3, 0.4, 0.5])

	const inputChannels = [channel1, channel2, channel3]

	const encoded = encodeWaveFromFloat32Channels(inputChannels, 1234, 24, SampleFormat.PCM)
	const decoded = decodeWaveToFloat32Channels(encoded)

	console.log(inputChannels)
	console.log(decoded.audioChannels)
}

test()
