const ADJACENT_JITTER_THRESHOLD = -2;
const BOUNDARY_JITTER_THRESHOLD = 4;
const MAX_RESAMPLING_COUNT = 5;
const RESAMPLING_MEAN_THRESHOLD = 6;
const PHASE1_INTERVAL = 50; // Phase 1 sampling interval
const PHASE2_INTERVAL = 200; // Phase 2 sampling interval
let phase1events = []; // Phase 1 sampling objects
let phase2events = []; // Phase 2 sampling objects
let lastSampleTime1 = Date.now(); // Last phase 1 sampling time
let lastSampleTime2 = Date.now(); // Last phase 2 sampling time
let isSmooth = false;

function calculateSum(array) {
    return array.reduce((sum, value) => sum + value, 0);
}
function calculateAbsSum(array) {
    return array.reduce((sum, value) => sum + Math.abs(value), 0);
}
function calculateAbsMean(array) {
    if (array.length === 0) return 0;
    return calculateAbsSum(array) / array.length;
}
function calculateVariance(array) {
    if (array.length === 0) return 0;
    const mean = calculateAbsMean(array);
    return array.reduce((variance, value) => variance + Math.pow(value - mean, 2), 0) / array.length;
}
function extractITR(events) {
    return events.map((e, i, arr) => i > 0 ? e.time - arr[i - 1].time : 0).filter(t => t > 0);
}
function handleInputDevice(e) {
    const currentTime = Date.now();
    phase1events.push({ time: currentTime, deltaX: e.deltaX, deltaY: e.deltaY, ctrlKey: e.ctrlKey });
    phase2events.push({ time: currentTime });
    // Phase 2 sampling
    if (currentTime - lastSampleTime2 >= PHASE2_INTERVAL) {
        isSmooth = analyzeSituation();
        phase2events = [];
        lastSampleTime2 = currentTime;
    }
    // Phase 1 sampling
    if (currentTime - lastSampleTime1 >= PHASE1_INTERVAL) {
        //console.log(isSmooth);
        analyzeEvents(isSmooth);
        phase1events = [];
        lastSampleTime1 = currentTime;
    }
}
function analyzeSituation() {
    let isSmooth = false;
    let resamplingSum = 0;
    let resamplingMean;
    const timeITR = extractITR(phase2events);
        const maxTimeDifference = Math.max(...timeITR);
        const minTimeDifference = Math.min(...timeITR);
        const lastIndexMax = timeITR.lastIndexOf(maxTimeDifference);
        const lastIndexMin = timeITR.lastIndexOf(minTimeDifference);
    const trimmedTimeITR = timeITR.filter((t, index) => index !== lastIndexMax && index !== lastIndexMin);
    let decreasingStreak = 0;

    //console.log(`timeITR: ${timeITR}`);
    //console.log(`trimmedTimeITR: ${trimmedTimeITR}`);

    for (let i = trimmedTimeITR.length - 1; i > Math.max(trimmedTimeITR.length - (MAX_RESAMPLING_COUNT + 1), 0); i--) {
        resamplingSum += trimmedTimeITR[i];
    }
        resamplingMean = resamplingSum / Math.min(trimmedTimeITR.length, MAX_RESAMPLING_COUNT);
    for (let i = trimmedTimeITR.length - 1; i > Math.max(trimmedTimeITR.length - (MAX_RESAMPLING_COUNT + 1), 0); i--) {
        if (trimmedTimeITR[i] - trimmedTimeITR[i - 1] >= ADJACENT_JITTER_THRESHOLD && resamplingMean >= RESAMPLING_MEAN_THRESHOLD) {
            decreasingStreak++;
            if (decreasingStreak === Math.min(MAX_RESAMPLING_COUNT, trimmedTimeITR.length - 1)) {
                isSmooth = true;
                break;
            }
        } else {
            decreasingStreak = 0;
            isSmooth = false;
        }
    }
    //console.log(`isSmooth: ${isSmooth}`);
    return isSmooth;
}
function analyzeEvents(isSmooth) {
    const timeITR = extractITR(phase1events)
    const sortedTimeITR = [...timeITR].sort((a, b) => a - b);
    const trimmedTimeITR = sortedTimeITR.slice(1, -1);
    const deltaXs = phase1events.map(e => e.deltaX);
    const deltaYs = phase1events.map(e => e.deltaY);
    const ctrlKeys = phase1events.map(e => e.ctrlKey);

    const deltaXsAbsSum = calculateAbsSum(deltaXs);
    const timeITR_Mean = calculateAbsMean(trimmedTimeITR);
    const timeITR_Max = Math.max(...timeITR);
    const timeITR_DEV = calculateVariance(trimmedTimeITR);
    const timeITR_StdDev = Math.sqrt(timeITR_DEV);

    //console.log(`timeITR_Mean: ${timeITR_Mean}, timeITR_Max: ${timeITR_Max}, timeITR_StdDev: ${timeITR_StdDev}`);
    //console.log(`sortedTimeITR: ${sortedTimeITR}`);
    //console.log(`trimmedTimeITR: ${trimmedTimeITR}`);

    if (isSmooth || Math.abs(timeITR_Mean - 8) <= timeITR_StdDev + BOUNDARY_JITTER_THRESHOLD / 4 || Math.abs(timeITR_Mean - 16) <= timeITR_StdDev + BOUNDARY_JITTER_THRESHOLD / 4 || Math.abs(timeITR_Mean - 33) <= BOUNDARY_JITTER_THRESHOLD || Math.abs(timeITR_Max - 67) <= BOUNDARY_JITTER_THRESHOLD) { // In macOS, the default auto-smooth scroll interval series is around [8, 16, 33, 67]
        console.log('TouchPad(Auto-Smoothing)');
        const deltaXsSum = calculateSum(deltaXs);
        const deltaYsSum = calculateSum(deltaYs);
        const vectorLength = Math.sqrt(deltaXsSum ** 2 + deltaYsSum ** 2);
        const vectorAngle = Math.atan2(deltaYsSum, deltaXsSum) * (180 / Math.PI);

        console.log(`Magnitude: ${vectorLength}, Argument: ${vectorAngle}(Deg)`);
    } else if (deltaXsAbsSum !== 0 || ctrlKeys.some(key => key === true) || deltaYs.every(value => Number.isInteger(value))) {
        console.log('TouchPad(Mannual-Dragging)');
        const deltaXsSum = calculateSum(deltaXs);
        const deltaYsSum = calculateSum(deltaYs);
        const vectorLength = Math.sqrt(deltaXsSum ** 2 + deltaYsSum ** 2);
        const vectorAngle = Math.atan2(deltaYsSum, deltaXsSum) * (180 / Math.PI);

        console.log(`Magnitude: ${vectorLength}, Argument: ${vectorAngle}(Deg)`);
    } else {
        console.log('MouseWheel');
        const deltaYsSum = calculateSum(deltaYs);
        if(deltaYsSum > 0) {
            console.log(`Magnitude: ${deltaYsSum}, Upwards`);
        } else if(deltaYsSum < 0) {
            console.log(`Magnitude: ${deltaYsSum}, Downwards`);
        }
    }
}