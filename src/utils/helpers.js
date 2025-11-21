export const getFormattedDate = (date) => date.toISOString().split('T')[0];

export const calculateScores = (data) => {
    // Body (75)
    let wakeUpScore = 0;
    if (data.wakeUpTime) {
        if (data.wakeUpTime <= "04:30") wakeUpScore = 25;
        else if (data.wakeUpTime <= "04:40") wakeUpScore = 20;
        else if (data.wakeUpTime <= "04:45") wakeUpScore = 15;
        else if (data.wakeUpTime <= "05:00") wakeUpScore = 10;
    }

    let daySleepScore = 0;
    const sleepMins = parseInt(data.daySleep) || 0;
    if (sleepMins <= 60) daySleepScore = 25;
    else if (sleepMins <= 70) daySleepScore = 20;
    else if (sleepMins <= 80) daySleepScore = 15;
    else if (sleepMins <= 90) daySleepScore = 10;
    else if (sleepMins <= 100) daySleepScore = 5;

    let toBedScore = 0;
    if (data.toBedTime) {
        if (data.toBedTime <= "21:30") toBedScore = 25;
        else if (data.toBedTime <= "21:45") toBedScore = 20;
        else if (data.toBedTime <= "22:00") toBedScore = 15;
        else if (data.toBedTime <= "22:15") toBedScore = 10;
        else if (data.toBedTime <= "22:30") toBedScore = 5;
    }

    // Soul (40)
    let japaScore = 0;
    if (data.japaTime) {
        if (data.japaTime <= "08:00") japaScore = 25;
        else if (data.japaTime <= "10:00") japaScore = 20;
        else if (data.japaTime <= "12:00") japaScore = 15;
        else if (data.japaTime <= "14:00") japaScore = 10;
        else if (data.japaTime <= "18:00") japaScore = 5;
    }

    const scoreMap = { 'present': 5, 'late': 3, 'absent': 0 };
    const mpScore = (scoreMap[data.shikshastakam] || 0) +
        (scoreMap[data.mangalAarti] || 0) +
        (scoreMap[data.morningClass] || 0);

    // Sadhana (65)
    const spMins = parseInt(data.readSpMins) || 0;
    const slokaMins = parseInt(data.readSlokaMins) || 0;
    const readScore = (spMins >= 20 ? 25 : (spMins / 20) * 25) + (slokaMins >= 10 ? 10 : (slokaMins / 10) * 10);

    const hearTotal = (parseInt(data.hearSpMins) || 0) + (parseInt(data.hearSmMins) || 0) + (parseInt(data.hearRspMins) || 0);
    const hearScore = hearTotal >= 30 ? 30 : (hearTotal / 30) * 30;

    return {
        body: Math.round(wakeUpScore + daySleepScore + toBedScore),
        soul: Math.round(japaScore + mpScore),
        sadhana: Math.round(readScore + hearScore),
        total: Math.round(wakeUpScore + daySleepScore + toBedScore + japaScore + mpScore + readScore + hearScore)
    };
};
