package main

func max_intercorr(x, y []float64) float64 {
	corr := intercorrelation(x, y)

	max := 0.0
	for _, v := range corr {
		if v > max {
			max = v
		}
	}
	return max
}

func pitchClassResponse(frame []float64, templates [][]float64) float64 {
	maxVal := 0.0

	for _, tmpl := range templates {
		//il faut que len(tmpl) < len(frame)
		if len(tmpl) > len(frame) {
			continue
		}

		v := max_intercorr(frame, tmpl)
		if v > maxVal {
			maxVal = v
		}
	}

	return maxVal
}

func computeFramePitchClasses(frame []float64, pcTemplates [12][][]float64) [12]float64 {

	var result [12]float64

	type PCResult struct {
		PC    int
		Value float64
	}

	ch := make(chan PCResult)

	for pc := 0; pc < 12; pc++ {
		pc := pc // 关键：复制 loop 变量

		go func(pc int) {
			val := pitchClassResponse(frame, pcTemplates[pc])
			ch <- PCResult{PC: pc, Value: val}
		}(pc)
	}

	for i := 0; i < 12; i++ {
		r := <-ch
		result[r.PC] = r.Value
	}

	return result
}

func accumulateOverFrames(frames [][]float64, pcTemplates [12][][]float64) []float64 {
	global := make([]float64, 12)
	frameCount := 0

	for _, frame := range frames {
		responses := computeFramePitchClasses(frame, pcTemplates)

		for pc := 0; pc < 12; pc++ {
			global[pc] += responses[pc]

			frameCount++
		}

		sum := 0.0
		for _, v := range global {
			sum += v
		}
		if sum == 0 {
			return global
		}
		for i := range global {
			global[i] /= sum
		}

		
	}
	return global
}
