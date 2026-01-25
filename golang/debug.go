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
		
	} else
	{
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
	} else
	{
		fmt.Println("Histogram saved at " + filename)
	}
}
