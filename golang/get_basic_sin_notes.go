package main

import (
	"fmt"
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
	fmt.Println(FILENAME)

	file, _ := os.Open(FILENAME)
	reader := wav.NewReader(file)

	defer file.Close()

	i := 0

	n := 0

	for {
		samples, err := reader.ReadSamples()
		if err == io.EOF {
			break
		}

		for _, s := range samples {
			if startSampleId <= i && i < endSampleId {
				s_float := reader.FloatValue(s, 0)
				res = append(res, s_float)
				n += 1
			}
			i += 1
		}
	}

	fmt.Println(n)

	return res
}

func GetSamplesNumber() int {
	return SAMPLESNUM
}