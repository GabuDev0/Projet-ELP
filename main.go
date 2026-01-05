package main

import (
	"fmt"
	"github.com/youpy/go-wav"
	"io"
	"os"
)

func main() {
	file_path := "example-files/scale_sin_C_maj.wav"
	fmt.Println(file_path)

	file, _ := os.Open(file_path)
	reader := wav.NewReader(file)

	defer file.Close()
	// For each note possible (C0-B10), intercorr with the signal
	var samplesFloat []float64
	for {
		// "samples" var is a packet of 2048 samples (if enough samples, otherwise less)
		samples, err := reader.ReadSamples()
		if err == io.EOF {
			break
		}

		for _, sample := range samples {
			samplesFloat = append(samplesFloat, reader.FloatValue(sample, 0))
			
			continue
		}
	}

	x := []float64{1, 1, 1, 1}
	y := []float64{2, 1}
	var noteSamplesFloat []float64 = intercorrelation(x, y)
	for i := 0; i < len(noteSamplesFloat); i++ {
		fmt.Println(noteSamplesFloat[i])
	}
}
