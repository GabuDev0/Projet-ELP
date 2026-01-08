#!/usr/bin/env python3

import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("corr.csv", header=None, names=["Index","Value"])
plt.plot(df["Index"], df["Value"])
plt.xlabel("Lag")
plt.ylabel("Normalized cross-correlation")
plt.show()
