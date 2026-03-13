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
    const shiftStart = hr2sec(startTime);
    const shiftEnd = hr2sec(endTime);
    const deliveryStart = hr2sec("8:00:00 am");
    const deliveryEnd = hr2sec("10:00:00 pm");
    let idle = 0;

    if (shiftStart < deliveryStart) idle += deliveryStart - shiftStart;
    if (shiftEnd > deliveryEnd) idle += shiftEnd - deliveryEnd;

    return sec2hr(idle);
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
    let content = '';
    try {
        content = fs.readFileSync(textFile, 'utf-8');
    } catch (err) {
        return;
    }

    let lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    let header = lines[0];
    let records = lines.slice(1).map(line => line.split(','));

    for (let i = 0; i < records.length; i++) {
        if (records[i][0] === driverID && records[i][2] === date) {
            records[i][9] = newValue; // hasBonus is column 10 (index 9)
            break;
        }
    }

    const updatedContent = [header, ...records.map(r => r.join(','))].join('\n') + '\n';
    fs.writeFileSync(textFile, updatedContent, 'utf-8');
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    let content = '';
    try {
        content = fs.readFileSync(textFile, 'utf-8');
    } catch (err) {
        return -1;
    }

    let lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) return -1;

    let records = lines.slice(1).map(line => line.split(',').map(f => f.trim()));

    let driverExists = false;
    let count = 0;

    const inputMonth = month.replace(/^0/, '');

    for (let r of records) {
        if (r[0] === driverID.trim()) {
            driverExists = true;
            let recordMonth = r[2].split('-')[1].replace(/^0/, '');
            if (recordMonth === inputMonth && r[9].toLowerCase() === 'true') count++;
        }
    }

    if (!driverExists) return -1;
    return count;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    driverID = driverID.trim();

    let content = fs.readFileSync(textFile, "utf8");

    let lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) return "0:00:00";

    let records = lines.slice(1).map(line => line.split(','));

    let totalSeconds = 0;
    let driverExists = false;

    for (let r of records) {

        if (r[0].trim() === driverID) {
            driverExists = true;

            let recordMonth = parseInt(r[2].trim().split('-')[1], 10);

            if (recordMonth === month) {
                totalSeconds += time2sec(r[7].trim());  // FIX HERE
            }
        }
    }

    if (!driverExists) return "0:00:00";

    return sec2hr(totalSeconds);
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

    let content = fs.readFileSync(textFile,'utf8');
    let rateContent = fs.readFileSync(rateFile,'utf8');

    let lines = content.split('\n').filter(l => l.trim() !== '');
    let rateLines = rateContent.split('\n').filter(l => l.trim() !== '');

    let records = lines.slice(1).map(l => l.split(','));
    let rateRecords = rateLines.slice(1).map(l => l.split(','));

    let dayOff = "";

    for (let r of rateRecords){
        if(r[0].trim() === driverID.trim()){
            dayOff = r[2].trim();
        }
    }

    let totalRequiredSeconds = 0;

    for (let r of records){

        if (r[0].trim() === driverID.trim()){

            let dateStr = r[2].trim();
            let [year, mon, day] = dateStr.split('-').map(Number);

            if(mon !== month) continue;

            let weekday = new Date(dateStr).toLocaleDateString('en-US',{weekday:'long'});

            if(weekday === dayOff) continue;

            let quota = 8*3600 + 24*60;

            if(year === 2025 && mon === 4 && day >= 10 && day <= 30){
                quota = 6*3600;
            }

            totalRequiredSeconds += quota;
        }
    }

    totalRequiredSeconds -= bonusCount * 7200;

    if(totalRequiredSeconds < 0) totalRequiredSeconds = 0;

    return sec2hr(totalRequiredSeconds);
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
    let content;
    try {
        content = fs.readFileSync(rateFile, "utf-8");
    } catch (err) {
        return 0;
    }

    if (!content) return 0;

    let lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return 0;

    let records = lines.map(line => line.split(',').map(f => f.trim()));

    let driverRecord = records.find(r => r[0].trim() === driverID.trim());
    if (!driverRecord) return 0;

    let basePay = parseInt(driverRecord[2], 10);
    let tier    = parseInt(driverRecord[3], 10);

    const tierAllowance = {1: 50, 2: 20, 3: 10, 4: 3};
    let allowedMissing = tierAllowance[tier] || 0;

    //convert hhh:mm:ss to seconds
    const time2sec = t => {
        const [h, m, s] = t.split(':').map(Number);
        return h*3600 + m*60 + s;
    };

    let actualSec = time2sec(actualHours);
    let requiredSec = time2sec(requiredHours);

    let missingSec = requiredSec - actualSec;
    if (missingSec <= 0) return basePay;

    let billableMissingHours = Math.floor(missingSec / 3600) - allowedMissing;
    if (billableMissingHours <= 0) return basePay;

    let deductionRatePerHour = Math.floor(basePay / 185);
    let salaryDeduction = billableMissingHours * deductionRatePerHour;

    return basePay - salaryDeduction;
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
