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
	const samplesPerJob = 2048

	jobs := make(chan []float64)
	results := make(chan []float64, numWorkers)

	var wg sync.WaitGroup

	defer file.Close()

	var songSamplesFloat []float64

	// Transform each Sample to a float and adds it to the songSamplesFloat slice
	for {
			// "samples" var is a packet of <=2048 samples (if enough samples, otherwise less)
			samples, err := reader.ReadSamples()
			if err == io.EOF {
				break
			}
			for _, sample := range samples {
				// the whole song samples
				songSamplesFloat = append(songSamplesFloat, reader.FloatValue(sample, 0))
			}

		}

	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go worker(jobs, results, &wg)
	}
	
	go func() {
		i := 0 // The global index of a sample
		j := 0 // The index in one pack of a sample
		var samplesFloat []float64
		// Place all the samples into packages (slices) of "samplesPerJob" size
		for {
			// If every sample has been sent to a job
			if i >= len(songSamplesFloat) {
				jobs <- samplesFloat
				break
			}
			
			// Creates packs of samplesPerJob length
			if j < samplesPerJob {
				samplesFloat = append(samplesFloat, songSamplesFloat[i])
				i++
				j++
			} else { // If the pack is done, sends the samples to the jobs
				j = 0
				jobs <- samplesFloat

				samplesFloat = []float64{}
			}
			
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
	

	//noteSamplesFloat := get_note_samples(61)

	//intercorr := intercorrelation(songSamplesFloat, noteSamplesFloat)

	//plotFloats(intercorr, "intercorrPlot61piano.jpg")
	//plotFloats(intercorrTotal, "intercorrPlot61piano2.jpg")

	fmt.Printf("len(intercorrTotal): ")
	fmt.Println(len(intercorrTotal))

	/*if verifyIntercorrelation(intercorr, noteSamplesFloat, noteSamplesFloat) {
		fmt.Println("WEE WOOO WEEEE WOOOOOOOO")
	}*/
	// testIntercorrelation()
}