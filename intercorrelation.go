package main

func intercorrelation(x, y []float64) []float64 {
	n := len(x)
	m := len(y)

	result := make([]float64, n+m-1)
	k := 0 // index of result for a certain lag (ranges from 0 to n+m-1)

	// Corresponds to each offset from the first non-zero position
	// (first element of x with last element of y)
	// to the last non-zero position
	// (last element of x with first element of y) 
	for lag := -m+1; lag < n; lag++ {
		var sum float64 = 0
		for i := 0; i < min(n, m); i++ {
			// If element index is outside the x list, product = 0
			if i+lag < 0 || i+lag >= n {
				continue
			}

			sum += x[i+lag] * y[i]
		}
		result[k] = sum
		k++
	}

	return result
}
