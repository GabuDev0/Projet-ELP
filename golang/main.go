package main

import (
	"fmt"
	"io"
	"os"
	"sync"

	"github.com/youpy/go-wav"
)

type Job struct {
	startingIndex int
	lenX          int
	lenY          int
	data          []float64
}

type Result struct {
	startingIndex int // at which index (of the total result) the elements of a partial result should start being added (to the total result)
	lenX          int
	lenY          int
	data          []float64
}

// Worker
func worker(jobs <-chan Job, results chan<- Result, wg *sync.WaitGroup) {
	defer wg.Done()

	noteSamplesFloat := GetNoteSamples(61)

	for job := range jobs {
		intercorr := intercorrelation(job.data, noteSamplesFloat)

		results <- Result{
			startingIndex: job.startingIndex,
			lenX:          len(job.data),
			lenY:          len(noteSamplesFloat),
			data:          intercorr,
		}
	}

}

func main() {
	file_path := "example-files/scale_piano_C_maj.wav"
	fmt.Println(file_path)

	file, _ := os.Open(file_path)
	reader := wav.NewReader(file)

	const NUM_WORKERS = 8
	const SAMPLES_PER_JOB = 2048

	jobs := make(chan Job)
	results := make(chan Result, NUM_WORKERS)

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

	for i := 0; i < NUM_WORKERS; i++ {
		wg.Add(1)
		go worker(jobs, results, &wg)
	}

	go func() {
		i := 0 // The global index of a sample
		j := 0 // The index in one pack of a sample
		k := 0 // at which index (of the total result) the elements of a partial result should start being added (to the total result)
		var samplesFloat []float64
		// Place all the samples into packages (slices) of "SAMPLES_PER_JOB" size
		for {
			// If every sample has been sent to a job
			if i >= len(songSamplesFloat) {
				jobs <- Job{
					startingIndex: k,
					lenX:          len(samplesFloat),
					lenY:          GetSamplesNumber(),
					data:          samplesFloat,
				}
				break
			}

			// Creates packs of SAMPLES_PER_JOB length
			if j < SAMPLES_PER_JOB {
				samplesFloat = append(samplesFloat, songSamplesFloat[i])
				i++
				j++
			} else { // If the pack is done, sends the samples to the jobs
				j = 0
				jobs <- Job{
					startingIndex: k,
					lenX:          len(samplesFloat),
					lenY:          GetSamplesNumber(),
					data:          samplesFloat,
				}

				// the next partial result should overlap starting at this index
				k += len(samplesFloat) // lenX

				// Empty the slice
				samplesFloat = []float64{}
			}

		}
		close(jobs)
	}()

	go func() {
		wg.Wait()
		close(results)
	}()

	// Contains the results of the intercorrelation computed with goroutines
	intercorrTotal := make([]float64, len(songSamplesFloat)+SAMPLESNUM-1)
	
	// Collector
	for partial := range results {
		fmt.Printf("Llen(partial): ")
		fmt.Println(len(partial.data))
		fmt.Println(partial.startingIndex)

		startingIndex := partial.startingIndex

		for i, elem := range partial.data {
			if startingIndex+i >= len(intercorrTotal) {
				break
			}
			intercorrTotal[startingIndex+i] += elem
		}
	}

	noteSamplesFloat := GetNoteSamples(61)

	// Test of incorrelation in one go
	intercorr := intercorrelation(songSamplesFloat, noteSamplesFloat)

	plotFloats(intercorr, "intercorrPlot61piano.jpg")
	plotFloats(intercorrTotal, "intercorrPlot61piano2.jpg")
}
