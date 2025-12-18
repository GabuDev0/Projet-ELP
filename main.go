package main

import (
	"fmt"
	"github.com/youpy/go-wav"
	"io"
	"os"
)

func main() {
	infile_path := "example-files/scale_sin_C_maj.wav"
	fmt.Println(infile_path)
	//flag.Parse()

	file, _ := os.Open(infile_path)
	reader := wav.NewReader(file)

  	defer file.Close()

	for {
		samples, err := reader.ReadSamples()
		if err == io.EOF {
			break
		}

		for _, sample := range samples {
			fmt.Printf("L/R: %d/%d\n", reader.IntValue(sample, 0), reader.IntValue(sample, 1))
		}
	}
}