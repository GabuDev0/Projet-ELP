package main

func intercorrelation(x, y []float64) []float64 {
	
	n := len(x)
	m := len(y)

	r := make([]float64, n+m-1)
	k := 0

	for lag := -m+1; lag < n; lag++ {
		var sum float64 = 0
		for i := 0; i < min(n, m); i++ {
			// If in the x list
			if i+lag >= 0 && i+lag < n {
				sum += x[i+lag] * y[i]
			}
		}
		r[k] = sum
		k++
	}

	return r
}
