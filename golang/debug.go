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
	"fmt"

	"gonum.org/v1/plot"
	"gonum.org/v1/plot/plotter"
	"gonum.org/v1/plot/vg"
)

// Creates a plot from floats.
func plotFloats(samples []float64, filename string) error {
	p := plot.New()
	p.Title.Text = "Samples audio"
	p.X.Label.Text = "Index"
	p.Y.Label.Text = "Amplitude"

	pts := make(plotter.XYs, len(samples))
	for i, s := range samples {
		pts[i].X = float64(i)
		pts[i].Y = s
	}

	line, err := plotter.NewLine(pts)
	if err != nil {
		return err
	}

	p.Add(line)

	save_err := p.Save(12*vg.Inch, 4*vg.Inch, filename)

	if save_err != nil {
		print("Save error when creating plot")

	} else {
		fmt.Println("Plot saved at " + filename)
	}

	return save_err
}

func plotHistogram(noteSamplesFloat []float64, filename string) {
	p := plot.New()
	p.Title.Text = "Histogramme"
	p.X.Label.Text = "Valeur"
	p.Y.Label.Text = "Fréquence"

	values := plotter.Values(noteSamplesFloat)

	h, err := plotter.NewHist(values, values.Len()) // 131 notes
	if err != nil {
		print(err)
	}

	p.Add(h)

	err = p.Save(6*vg.Inch, 4*vg.Inch, filename)
	if err != nil {
		print(err)
	} else {
		fmt.Println("Histogram saved at " + filename)
	}
}

// If x == y, returns True else False
func isEqual(x, y []float64) bool {
	if len(x) != len(y) {
		return false
	}
	for i := 0; i < len(x); i++ {
		if x[i] != y[i] {
			return false
		}
	}

	return true
}

func testIsEqual() {
	testPassed := true
	x1 := []float64{0, 0, 2, 1}
	y1 := []float64{0, 0, 2, 1}
	// expected: true
	if isEqual(x1, y1) != true {
		testPassed = false
		fmt.Println("testIsEqual(): test 1 failed")
	}

	x2 := []float64{0}
	y2 := []float64{2, 1}
	// expected: false
	if isEqual(x2, y2) != false {
		testPassed = false
		fmt.Println("testIsEqual(): test 2 failed")
	}

	x3 := []float64{}
	y3 := []float64{}
	// expected: true
	if isEqual(x3, y3) != true {
		testPassed = false
		fmt.Println("testIsEqual(): test 3 failed")
	}

	x4 := []float64{43, 402}
	y4 := []float64{43}
	// expected: false
	if isEqual(x4, y4) != false {
		testPassed = false
		fmt.Println("testIsEqual(): test 4 failed")
	}

	if testPassed {
		fmt.Println("-- testIsEqual(): everything looks fine")
	}
}
