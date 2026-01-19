package main

import (
	"fmt"
	"github.com/youpy/go-wav"
	"io"
	"os"
	"sync"
)

func worker(jobs <-chan []float64, results chan<- []float64, wg *sync.WaitGroup) {
	defer wg.Done()

	noteSamplesFloat := get_note_samples(61) //WARNING: add as a parameter
	
	var allIntercorr []float64

	for samplesFloat := range jobs {
		intercorr := intercorrelation(samplesFloat, noteSamplesFloat)
		allIntercorr = append(allIntercorr, intercorr...)
	}

	results <- allIntercorr
}

func main() {
	file_path := "example-files/scale_piano_C_maj.wav"
	fmt.Println(file_path)

	file, _ := os.Open(file_path)
	reader := wav.NewReader(file)

	const numWorkers = 8

	jobs := make(chan []float64)
	results := make(chan []float64, numWorkers)

	var wg sync.WaitGroup

	defer file.Close()

	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go worker(jobs, results, &wg)
	}
	var songSamplesFloat []float64
	go func() {
		for {
			// "samples" var is a packet of <=2048 samples (if enough samples, otherwise less)
			samples, err := reader.ReadSamples()
			if err == io.EOF {
				break
			}
			var samplesFloat []float64
			for _, sample := range samples {
				// on change la sample en float
				samplesFloat = append(samplesFloat, reader.FloatValue(sample, 0))
				songSamplesFloat = append(songSamplesFloat, reader.FloatValue(sample, 0))
			}
			jobs <- samplesFloat

		}
		close(jobs)
	}()

	go func() {
		wg.Wait()
		close(results)
	}()

	// Collector
	var intercorrTotal []float64
	for partial := range results {
		fmt.Printf("Llen(partial): ")
		fmt.Println(len(partial))

		for _, elem := range partial {
			intercorrTotal = append(intercorrTotal, elem)
		}
	}
	

	noteSamplesFloat := get_note_samples(61)

	intercorr := intercorrelation(songSamplesFloat, noteSamplesFloat)

	plotFloats(intercorr, "intercorrPlot61piano.jpg")
	plotFloats(intercorrTotal, "intercorrPlot61piano2.jpg")

	fmt.Printf("len(intercorrTotal): ")
	fmt.Println(len(intercorrTotal)) // BUG:
	// atm, there's only 8 partial results

	// testIntercorrelation()
}