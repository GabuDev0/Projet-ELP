# Projet-ELP
## Golang

This project (called the Project) is made for the golang part of the subject ELP of the 3rd year program of the Telecoms Department of INSA Lyon Engineering School.

The Project outputs the (most) used key (in major mode) of a given song.
From a .wav file, it will analyze the most used notes of the song, and deduce which major mode use these most used notes.

### Context:
Modern music mostly uses "diatonic scales", which are sets of seven notes chosen from the twelve notes of the chromatic scale (C, C#, D, D#, E, F, F#, G, G#, A, A#, B). Each diatonic scale has multiple modes, which change the feel of a music depending on which note of the scale is considered the **tonal center**. The most commonly used are the **major** mode and the **natural minor** mode (often simply called **minor**). This project will only output the relative **major** mode of any given song.

### Usage instructions
(1) Download the archive.
(2) Move to the "golang" directory of the Project.
(3) Use the command ```go run .``` or ```go run main.go```
(4) Benchmark results are output in the "results.csv" file.

Current progress:
- [x] Can read a .wav file
- [x] Can intercorrelate the input with a chosen note
- [x] Can calculate the most used notes of the input
- [x] Can deduce from the most used notes the tonality of the input

Optimization ideas:
- Getting one note's samples loops through the whole note file.
Potential time optimization: 12 times faster (as the file contains 12 notes)
- Instead of using a file containing 0.25s of one particular note, use a sine table with one period of a sine wav freq modulated, or multiple tabs containing one period of a sine wav.
Potential time optimization: samples from notes of 0.25s divided by samples from sine waves of minimum 440Hz (arbitrary value chosen for relevant ranges) => ~100 times faster
- When doing parallel intercorrelations, there are overlapping values that has to be added for the result to be correct. Those overlapping values are computed multiple times (once per job, thus twice)
Potential time optimization: negligible compared to the methods above
