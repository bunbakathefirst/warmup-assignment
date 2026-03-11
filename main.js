const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================

function hr2sec(time){
    let period = time.slice(-2);
    time = time.slice(0, -3);

    let [h,m,s] = time.split(':').map(Number);

    if(period === 'pm' && h !== 12){
        h += 12;
    }
    if(period === 'am' && h === 12){
        h = 0;
    }

    return h*3600 + m*60 + s;
}
function sec2hr(sec){
    const z = n => (n < 10 ? '0' : '') + n;
    const hrs = (sec / 3600 | 0);
    const min = (sec % 3600 / 60 | 0);
    const secs = (sec % 60 | 0);
    return hrs + ':' + z(min) + ':' + z(secs);
}

function getShiftDuration(startTime, endTime) {
    let end = hr2sec(endTime);
    const start = hr2sec(startTime);

    if (end < start){
    end = end + 86400;
    }
    let res = end - start;

    return(res<0?'-':'') + sec2hr(Math.abs(res)); //i shoudl remmove the negative case since i fixed it but if it works it works
    //too scaredto change this lmfao
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================

function getIdleTime(startTime, endTime) {
    const res = hr2sec(endTime) - hr2sec(startTime);
    return(res<0?'-':'') + sec2hr(Math.abs(res)); //i guess it works here 4 some reason
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================

function time2sec(time){
    let [h,m,s] = time.split(':').map(Number);
    return h*3600 + m*60 + s;
}

function getActiveTime(shiftDuration, idleTime) {
    let sd = time2sec(shiftDuration);
    let it = time2sec(idleTime);

    let res = sd - it;

    const ress = sec2hr(res);
    return ress;
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    let at = time2sec(activeTime);

    const normalQuota = 8*3600 + 24*60;
    const eidQuota = 6*3600;

    let quota;

    if (date >= "2025-04-10" && date <= "2025-04-30") {
        quota = eidQuota;
    } else {
        quota = normalQuota;
    }

    return at >= quota;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================

//You need to search for fs.readFileSync() and fs.writeFileSync() functions in order to read and write from a text file.


function addShiftRecord(textFile, shiftObj) {
    let content = '';
    try {
        content = fs.readFileSync(textFile, 'utf-8');
    } catch (err) {
        content = '';
    }

    let lines = content.split('\n').filter(line => line.trim() !== '');
    let header = lines[0] || "DriverID,DriverName,Date,StartTime,EndTime,ShiftDuration,IdleTime,ActiveTime,MetQuota,HasBonus";
    let records = lines.slice(1).map(line => line.split(','));

    if (records.some(r => r[0] === shiftObj.driverID && r[2] === shiftObj.date)) {
        return {};
    }

    const shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    const idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    const activeSec = hr2sec(shiftDuration) - hr2sec(idleTime);
    const activeTime = sec2hr(activeSec);
    const quotaMet = metQuota(shiftObj.date, activeTime);

    const newLine = [
        shiftObj.driverID,
        shiftObj.driverName,
        shiftObj.date,
        shiftObj.startTime,
        shiftObj.endTime,
        shiftDuration,
        idleTime,
        activeTime,
        quotaMet,
        false
    ].join(',');

    let lastIndex = -1;
    for (let i = 0; i < records.length; i++) {
        if (records[i][0] === shiftObj.driverID) lastIndex = i;
    }

    if (lastIndex === -1) {
        records.push(newLine.split(','));
    } else {
        records.splice(lastIndex + 1, 0, newLine.split(','));
    }

    const updatedContent = [header, ...records.map(r => r.join(','))].join('\n') + '\n';
    fs.writeFileSync(textFile, updatedContent, 'utf-8');

    return {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime,
        metQuota: quotaMet,
        hasBonus: false
    };
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
