package main

import (
	"fmt"
	"log"
	"slices"
)

func intercorrelation(x, y []float64) []float64 {
	n := len(x)
	m := len(y)

	if n < m {
		log.Fatal("error: n < m")
	}

	result := make([]float64, n+m-1)
	k := 0 // index of result for a certain lag (ranges from 0 to n+m-1)

	// Corresponds to each offset from the first non-zero position
	// (first element of x with last element of y)
	// to the last non-zero position
	// (last element of x with first element of y) 
	for lag := -m+1; lag < n; lag++ {
		var sum float64 = 0
		for i := 0; i < m; i++ {
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

func testIntercorrelation() {
	x1 := []float64{1, 1, 1, 1}
	y1 := []float64{2, 1}

	f1 := intercorrelation(x1, y1)

	expected1 := []float64{
		1, 3, 3, 3, 2,
	}

	if !slices.Equal(f1, expected1) {
		panic("Error f1")
	}

	x2 := []float64{2, 1}
	y2 := []float64{1, 1, 1, 1}
	

	f2 := intercorrelation(x2, y2)

	expected2 := []float64{
		2, 3, 3, 3, 1,
	}

	if !slices.Equal(f2, expected2) {
		fmt.Println("Error f2")
		for i := 0; i < len(f2); i++ {
			fmt.Println(f2[i])
		}
		fmt.Println("Should be:")
		for i := 0; i < len(f2); i++ {
			fmt.Println(expected2[i])
		}
		panic("Error f2")
	}

	fmt.Println("** Tous les tests ont été passés avec succès **")
}