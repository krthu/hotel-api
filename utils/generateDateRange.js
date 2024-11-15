module.exports.generateDateRange = (startDate, endDate) => {
    const dateArray = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {

        const dateString = currentDate.toISOString().split('T')[0];
        dateArray.push(dateString);

        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
}