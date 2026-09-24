# Serial benchmark matrix

Seconds since navigation; MB are decimal observed browser HTTP bytes (lower bounds for incomplete responses), including reported canceled-body chunks. See the report for assumptions and limits.

| Constraint | Tier | Cache | Result | Diorama s | GPU complete s | Touch accepted s | MB | Request events |
|---|---|---|---|---:|---:|---:|---:|---:|
| fast | before | cold | passed | 0.22 | — | 20.14 | 143.47 | 139 |
| fast | before | warm | passed | 4.34 | — | 19.79 | 141.72 | 139 |
| fast | minimal | cold | passed | 0.22 | 7.25 | 7.39 | 8.81 | 107 |
| fast | minimal | warm | passed | 0.14 | 5.83 | 6.00 | 0.00 | 107 |
| fast | low | cold | passed | 0.21 | 9.32 | 9.91 | 19.69 | 111 |
| fast | low | warm | passed | 0.15 | 8.27 | 8.91 | 0.00 | 111 |
| cpu4 | before | cold | failed | — | — | — | 28.80 | 78 |
| cpu4 | before | warm | not-attempted | — | — | — | — | — |
| cpu4 | minimal | cold | passed | 0.41 | 11.71 | 11.98 | 8.81 | 107 |
| cpu4 | minimal | warm | passed | 0.48 | 10.56 | 10.81 | 0.00 | 107 |
| cpu4 | low | cold | passed | 0.49 | 17.69 | 18.05 | 19.69 | 111 |
| cpu4 | low | warm | passed | 0.60 | 16.95 | 17.24 | 0.00 | 111 |
| cpu6 | before | cold | failed | 0.64 | — | — | 10.33 | 78 |
| cpu6 | before | warm | passed | 23.02 | — | 113.96 | 128.54 | 139 |
| cpu6 | minimal | cold | passed | 0.76 | 15.12 | 15.50 | 8.81 | 107 |
| cpu6 | minimal | warm | passed | 0.89 | 13.23 | 13.54 | 0.00 | 107 |
| cpu6 | low | cold | passed | 0.69 | 23.30 | 23.68 | 19.69 | 111 |
| cpu6 | low | warm | passed | 0.83 | 21.41 | 21.90 | 0.00 | 111 |
| reported4 | before | cold | failed | 13.08 | — | — | 51.39 | 84 |
| reported4 | before | warm | failed | 0.17 | — | — | 50.86 | 94 |
| reported4 | minimal | cold | passed | 2.47 | 23.40 | 23.60 | 7.95 | 107 |
| reported4 | minimal | warm | passed | 0.16 | 5.80 | 6.39 | 0.94 | 107 |
| reported4 | low | cold | passed | 3.49 | 47.82 | 48.12 | 18.83 | 111 |
| reported4 | low | warm | passed | 1.81 | 11.13 | 11.74 | 0.95 | 111 |
| net16 | before | cold | failed | 30.10 | — | — | 22.91 | 78 |
| net16 | before | warm | failed | 0.22 | — | — | 21.13 | 80 |
| net16 | minimal | cold | passed | 3.77 | 42.18 | 42.39 | 7.13 | 107 |
| net16 | minimal | warm | passed | 0.15 | 5.83 | 6.43 | 0.88 | 107 |
| net16 | low | cold | passed | 5.78 | 99.22 | 99.85 | 18.26 | 111 |
| net16 | low | warm | passed | 1.86 | 11.34 | 11.96 | 0.39 | 111 |
| net05 | before | cold | failed | — | — | — | 0.25 | 26 |
| net05 | before | warm | failed | — | — | — | 0.00 | 26 |
| net05 | minimal | cold | passed | 10.86 | 118.53 | 118.67 | 6.55 | 107 |
| net05 | minimal | warm | passed | 0.14 | 5.77 | 6.37 | 0.22 | 107 |
| net05 | low | cold | failed | 16.32 | — | — | 6.80 | 87 |
| net05 | low | warm | failed | 0.31 | — | — | 6.99 | 98 |
| combined4 | before | cold | failed | 13.41 | — | — | 30.90 | 79 |
| combined4 | before | warm | failed | 0.44 | — | — | 0.00 | 78 |
| combined4 | minimal | cold | passed | 3.19 | 27.06 | 27.30 | 7.97 | 107 |
| combined4 | minimal | warm | passed | 0.51 | 10.24 | 10.55 | 0.97 | 107 |
| combined4 | low | cold | passed | 3.66 | 54.47 | 55.18 | 18.92 | 111 |
| combined4 | low | warm | passed | 2.03 | 20.00 | 20.67 | 1.00 | 111 |
| combined16 | before | cold | failed | 30.54 | — | — | 20.54 | 78 |
| combined16 | before | warm | failed | — | — | — | 15.66 | 78 |
| combined16 | minimal | cold | passed | 3.92 | 45.81 | 46.12 | 7.18 | 107 |
| combined16 | minimal | warm | passed | 0.43 | 10.17 | 11.02 | 0.88 | 107 |
| combined16 | low | cold | passed | 5.95 | 106.38 | 106.64 | 18.28 | 111 |
| combined16 | low | warm | passed | 2.07 | 17.77 | 18.04 | 0.40 | 111 |
| combined05 | before | cold | failed | — | — | — | 0.25 | 26 |
| combined05 | before | warm | failed | — | — | — | 0.00 | 26 |
| combined05 | minimal | cold | failed | 11.28 | — | — | 6.30 | 97 |
| combined05 | minimal | warm | passed | 0.74 | 20.91 | 21.37 | 0.65 | 107 |
| combined05 | low | cold | failed | 16.47 | — | — | 6.29 | 86 |
| combined05 | low | warm | failed | 0.81 | — | — | 6.32 | 96 |
