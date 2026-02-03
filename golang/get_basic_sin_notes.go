/*
MIT License

Copyright (c) 2026 INSA Lyon Telecoms Department

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

package main

import (
	"io"
	"os"

	"github.com/youpy/go-wav"
)
const SAMPLESNUM int = 0

// note: int; ranges C->B = 0-11
// Returns a slice containing 0.25 seconds of samples (1 note) from everyOctaveStacked.wav
func GetNoteSamples(note int) []float64 {
	FILENAME := "everyOctaveStacked.wav"

	// Cut the file into one note of 0.25s
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
