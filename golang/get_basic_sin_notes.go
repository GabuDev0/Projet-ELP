package main

import (
	"io"
	"os"

	"github.com/youpy/go-wav"
)
const SAMPLESNUM int = 0

// note: int; ranges C0-B10 = 0-130
// Returns a slice containing 0.25 seconds of samples (1 note) from every_sin_notes.wav
func GetNoteSamples(note int) []float64 {
	FILENAME := "every_sin_notes.wav"

	// Cut the "every_sin_notes.wav" file into a note of 0.25s
	var res []float64

	// 0.25 seconds per note, multiplied by 44.1kHz
	startSampleId := note * 11025 // 44100/4

	// ends 0.25 seconds right after
	endSampleId := (note + 1) * 11025

	file, _ := os.Open(FILENAME)
	reader := wav.NewReader(file)

	defer file.Close()

	i := 0 // The sample index. If the sample is in the range of the desired note, it will be appended to the result slice

	// Reads all samples
	for {
		samples, err := reader.ReadSamples() // "samples" variables are packs of 204 or less samples
		if err == io.EOF {
			break
		}

		// Only keep the samples of the desired note
		// And converts them to float
		for _, s := range samples {
			if startSampleId <= i && i < endSampleId {
				s_float := reader.FloatValue(s, 0)
				res = append(res, s_float)
			}
			i += 1
		}
	}

	return res
}

// Returns the length of the slice returned by GetNoteSamples()
func GetSamplesNumber() int {
	return SAMPLESNUM
}
