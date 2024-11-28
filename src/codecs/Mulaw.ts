/////////////////////////////////////////////////////////////////////////////////////////////
// Encode 16-bit linear PCM samples into 8-bit mu-Law samples.
/////////////////////////////////////////////////////////////////////////////////////////////
export function encodeMulaw(pcmSamples: Int16Array): Uint8Array {
	const muLawSamples = new Uint8Array(pcmSamples.length)

	for (let i = 0; i < pcmSamples.length; i++) {
		muLawSamples[i] = pcmToMulawSample(pcmSamples[i])
	}

	return muLawSamples
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Decode 8-bit mu-Law samples into 16-bit PCM samples.
/////////////////////////////////////////////////////////////////////////////////////////////
export function decodeMulaw(muLawSamples: Uint8Array) {
	const pcmSamples = new Int16Array(muLawSamples.length)

	for (let i = 0; i < muLawSamples.length; i++) {
		pcmSamples[i] = mulawToPcmSample(muLawSamples[i])
	}

	return pcmSamples
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Encode a 16-bit linear PCM sample as 8-bit mu-Law
/////////////////////////////////////////////////////////////////////////////////////////////
export function pcmToMulawSample(pcmSample: number) {
	// Get the sample into sign-magnitude

	// Get sign bit
	const sign = (pcmSample >> 8) & 0x80

	if (sign !== 0) {
		pcmSample = -pcmSample
	}

	// Convert from 16 bit linear to ulaw
	pcmSample += 132 // 0x84

	if (pcmSample > 32635) {
		pcmSample = 32635
	}

	const exponent = encodingLookup[(pcmSample >> 7) & 0xff]
	const mantissa = (pcmSample >> (exponent + 3)) & 0x0f

	const mulawSample = ~(sign | (exponent << 4) | mantissa)

	return mulawSample
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Decode a 8-bit mu-Law sample as 16-bit PCM.
/////////////////////////////////////////////////////////////////////////////////////////////
export function mulawToPcmSample(muLawSample: number) {
	muLawSample = ~muLawSample

	const sign = muLawSample & 0x80

	const exponent = (muLawSample >> 4) & 0x07
	const mantissa = muLawSample & 0x0f

	let pcmSample = decodingLookup[exponent] + (mantissa << (exponent + 3))

	if (sign !== 0) {
		pcmSample = -pcmSample
	}

	return pcmSample
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Encoding lookup table
/////////////////////////////////////////////////////////////////////////////////////////////
const encodingLookup = new Uint8Array([
	0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3,
	4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
	5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
	5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
	6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
	6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
	6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
	6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
	7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
	7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
	7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
	7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
	7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
	7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
	7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
	7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7])

const decodingLookup = new Uint16Array([0, 132, 396, 924, 1980, 4092, 8316, 16764])
