Step lists POSTed to drive.js for each capture session (see ../drive.js for the step vocabulary). Every session was
started as:  START_PAUSED=1 node drive.js <url> <outdir> 160x120 <dpr> <light|dark> <port> 2026
(the 160x120 viewport keeps the ~550 stepped frames cheap; each shot resizes to its real viewport first), except S1,
which ran at 1120x640 DPR 3 throughout. DPR: S1, L, D, L2, D2, SQ = 3; M = 6; HL = 5.
L-light-devices / D-dark-devices: tablet, landscape and portrait phone, card (their desktop shots caught the resize
unpainted and were retaken in L2 / D2 with two frames after the resize). SQ runs were made for each seed build.
