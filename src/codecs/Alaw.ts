/////////////////////////////////////////////////////////////////////////////////////////////
// Encode 16-bit linear PCM samples into 8-bit a-Law samples.
/////////////////////////////////////////////////////////////////////////////////////////////
export function encodeAlaw(pcmSamples: Int16Array) {
	const aLawSamples = new Uint8Array(pcmSamples.length)

	for (let i = 0; i < pcmSamples.length; i++) {
		aLawSamples[i] = pcmToAlawSample(pcmSamples[i])
	}

	return aLawSamples
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Decode 8-bit a-Law samples into 16-bit PCM samples.
/////////////////////////////////////////////////////////////////////////////////////////////
export function decodeAlaw(aLawSamples: Uint8Array) {
	const pcmSamples = new Int16Array(aLawSamples.length);

	for (let i = 0; i < aLawSamples.length; i++) {
		pcmSamples[i] = alawToPcmSample(aLawSamples[i])
	}

	return pcmSamples
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Encode a 16-bit linear PCM sample as 8-bit A-Law.
/////////////////////////////////////////////////////////////////////////////////////////////
export function pcmToAlawSample(pcmSample: number) {
	if (pcmSample === -32768) {
		pcmSample = -32767
	}

	const sign = ((~pcmSample) >> 8) & 0x80

	if (sign !== 0) {
		pcmSample = -pcmSample;
	}

	if (pcmSample > 32635) {
		pcmSample = 32635
	}

	let compandedValue: number

	if (pcmSample >= 256) {
		const exponent = logTable[(pcmSample >> 8) & 0x7f]
		const mantissa = (pcmSample >> (exponent + 3)) & 0x0f

		compandedValue = (exponent << 4) | mantissa
	} else {
		compandedValue = pcmSample >> 4
	}

	const aLawSample = compandedValue ^ (sign ^ 0x55)

	return aLawSample
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Decode a 8-bit A-Law sample as 16-bit PCM.
/////////////////////////////////////////////////////////////////////////////////////////////
export function alawToPcmSample(aLawSample: number) {
	let sign = 0

	aLawSample ^= 0x55

	if (aLawSample & 0x80) {
		aLawSample &= ~(1 << 7)
		sign = -1
	}

	const position = ((aLawSample & 0xf0) >> 4) + 4

	let decoded = 0

	if (position != 4) {
		decoded = (1 << position) |
				  ((aLawSample & 0x0f) << (position - 4)) |
				  (1 << (position - 5))
	} else {
		decoded = (aLawSample << 1) | 1
	}

	if (sign !== 0) {
		decoded = -decoded
	}

	const pcmSample = decoded * -8

	return pcmSample
}

const logTable = new Uint8Array([
	1, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
	6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
	7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
	7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7
])
