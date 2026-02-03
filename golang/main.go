package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"sort"
	"strconv"
	"sync"
	"time"

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

type NoteValue struct {
	note  string
	value float64
}

const NUM_WORKERS = 8
const SAMPLES_PER_JOB = 2048

func appendCSV(filename string, numWorkers int, samplesPerJob int, execTime time.Duration) error {
	file, err := os.OpenFile("results.csv", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	// Vérifie si le fichier est vide → écrire le header
	info, err := file.Stat()
	if err != nil {
		return err
	}

	writer := csv.NewWriter(file)

	if info.Size() == 0 {
		header := []string{
			"filename",
			"NUM_WORKERS",
			"SAMPLES_PER_JOB",
			"execTime_ms",
		}
		if err := writer.Write(header); err != nil {
			return err
		}
	}

	// Ligne de données
	record := []string{
		filename,
		strconv.Itoa(numWorkers),
		strconv.Itoa(samplesPerJob),
		execTime.String(),
	}

	if err := writer.Write(record); err != nil {
		return err
	}

	writer.Flush()
	fmt.Println("CSV result file appended.")
	return writer.Error()
}

// Worker
func worker(jobs <-chan Job, results chan<- Result, wg *sync.WaitGroup, note int) {
	defer wg.Done()

	noteSamplesFloat := GetNoteSamples(note)

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

func corrEnergy(corr []float64) float64 {
	sum := 0.0
	for _, v := range corr {
		sum += v * v // ou math.abs(v) ?
	}
	return sum
}

func parallelIntercorr(songSamplesFloat []float64, note int) []float64 {
	start := time.Now()

	jobs := make(chan Job)
	results := make(chan Result, NUM_WORKERS)

	var wg sync.WaitGroup

	for i := 0; i < NUM_WORKERS; i++ {
		wg.Add(1)
		go worker(jobs, results, &wg, note)
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
				if len(samplesFloat) > 0 {
					jobs <- Job{
						startingIndex: k,
						lenX:          len(samplesFloat),
						lenY:          GetSamplesNumber(),
						data:          samplesFloat,
					}
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
		startingIndex := partial.startingIndex

		for i, elem := range partial.data {
			if startingIndex+i >= len(intercorrTotal) {
				break
			}
			intercorrTotal[startingIndex+i] += elem
		}
	}

	fmt.Printf("%s execution time: %v\n", "parallelIntercorr", time.Since(start))

	return intercorrTotal
}

func transformFileToSample(file_path string) []float64 {
	file, _ := os.Open(file_path)
	reader := wav.NewReader(file)

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
	return songSamplesFloat
}

func getMostUsedNotes(noteEnergyDic map[string]float64) []string {
	// Transforms the map (unordered) to a list (ordered)
	var noteList []NoteValue
	for note, value := range noteEnergyDic {
		noteList = append(noteList, NoteValue{note, value})
	}

	sort.Slice(noteList, func(i, j int) bool {
		return noteList[i].value > noteList[j].value
	})

	top7notes := noteList[:7] // The 7 most used notes

	fmt.Println("7 most used notes: (diatonic scale)")
	var diatonicScale []string
	for _, noteValue := range top7notes {
		diatonicScale = append(diatonicScale, noteValue.note)
		fmt.Println(noteValue.note)
	}

	return diatonicScale
}

func detectMajorKey(notes []string) string {
	var majorScales = map[string][]string{
		"C":  {"C", "D", "E", "F", "G", "A", "B"},
		"C#": {"C#", "D#", "F", "F#", "G#", "A#", "C"},
		"D":  {"D", "E", "F#", "G", "A", "B", "C#"},
		"D#": {"D#", "F", "G", "G#", "A#", "C", "D"},
		"E":  {"E", "F#", "G#", "A", "B", "C#", "D#"},
		"F":  {"F", "G", "A", "A#", "C", "D", "E"},
		"F#": {"F#", "G#", "A#", "B", "C#", "D#", "F"},
		"G":  {"G", "A", "B", "C", "D", "E", "F#"},
		"G#": {"G#", "A#", "C", "C#", "D#", "F", "G"},
		"A":  {"A", "B", "C#", "D", "E", "F#", "G#"},
		"A#": {"A#", "C", "D", "D#", "F", "G", "A"},
		"B":  {"B", "C#", "D#", "E", "F#", "G#", "A#"},
	}

	noteSet := make(map[string]bool)
	for _, n := range notes {
		noteSet[n] = true
	}

	bestKey := ""
	bestScore := 0

	for key, scale := range majorScales {
		score := 0
		for _, note := range scale {
			if noteSet[note] {
				score++
			}
		}

		if score > bestScore {
			bestScore = score
			bestKey = key
		}
	}

	if bestScore >= 5 {
		return bestKey + "maj"
	}

	return "Tonalité indéterminée"
}

func main() {
	start := time.Now()
	pitchClasses := map[string][]int{
		"C":  {1},
		"C#": {2},
		"D":  {3},
		"D#": {4},
		"E":  {5},
		"F":  {6},
		"F#": {7},
		"G":  {8},
		"G#": {9},
		"A":  {10},
		"A#": {11},
		"B":  {12},
	}

	//file_path := "example-files/a-tender-feeling-piano-torby-brand.mp3"
	file_path := "example-files/scale_piano_C_maj.wav"

	songSamplesFloat := transformFileToSample(file_path)

	//Store the energy of every pitch class in pcEnergy
	pcEnergy := make(map[string]float64)

	for pc, notes := range pitchClasses {
		maxEnergy := 0.0
		for _, note := range notes {
			corr := parallelIntercorr(songSamplesFloat, note)
			energy := corrEnergy(corr)
			if energy >= maxEnergy {
				maxEnergy = energy
			}
		}
		pcEnergy[pc] = maxEnergy
	}
	

	fmt.Println("Pitch class energies:")
	for pc, eng := range pcEnergy {
		fmt.Println(pc, ":", eng)
	}
	fmt.Printf("Major scale used: ")
	fmt.Println(detectMajorKey(getMostUsedNotes(pcEnergy)))

	execTime := time.Since(start)
	fmt.Printf("%s execution time: %v\n", "main", execTime)

	appendCSV(file_path, NUM_WORKERS, SAMPLES_PER_JOB, execTime)
}
