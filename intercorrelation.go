package main

import "math"

func Intercorreltion(x, y []float64) []float64 {
	n := len(x)
	m := len(y)

	result := make([]float64, n)

	for lag := 0; lag < n; lag++ {
		sum := 0.0
		energyX := 0.0
		energyY := 0.0

		for i := 0; i < n; i++ {
			j := i - lag
			if j >= 0 && j < m {
				sum += x[i] * y[j]
				energyX += x[i] * x[i]
				energyY += y[j] * y[i]
			}
		}

		den := math.Sqrt(energyX * energyY)
		if den > 0 {
			result[lag] = sum / den
		} else {
			result[lag] = 0
		}
	}

	return result
}
