
module.exports.validateBookingData = (data) => {
    const bedsInRooms = {
       single: 1,
       double: 2,
       suit: 3
    }

    const requiredFields = ["name", "email", "guests", "startDate", "endDate", "rooms"];
    for (let field of requiredFields) {
        if (!data.hasOwnProperty(field)) {
            return { valid: false, message: `Missing field: ${field}` };
        }
    }

    if (!Array.isArray(data.rooms) || data.rooms.length === 0) {
        return { valid: false, message: "Rooms must be a non-empty array" };
    }

    const validRoomTypes = ["single", "double", "suit"];
    let hasValidRoom = false;
    let totalBeds = 0;
 
    for (let room of data.rooms) {

        if (!room.type || !room.hasOwnProperty("quantity")) {
            return { valid: false, message: "Each room must have a type and a quantity" };
        }

        if (validRoomTypes.includes(room.type.toLowerCase())) {
            hasValidRoom = true;
        }


        if (typeof room.quantity !== "number" || room.quantity <= 0) {
            return { valid: false, message: "Quantity must be a positive number" };
        }
        totalBeds += (bedsInRooms[room.type] * parseInt(room.quantity));
    }


    if (!hasValidRoom) {
        return { valid: false, message: "At least one room must be of type 'single', 'double', or 'suit'" };
    }

    if (totalBeds < data.guests) {
        return { valid: false, message: "Not enough beds for the number of guests" };
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
        return { valid: false, message: "Start date cannot be in the past" };
    }

    if (startDate.getTime() === endDate.getTime()) {
        return { valid: false, message: "Start date and end date cannot be the same" };
    }

    if (endDate.getTime() < startDate.getTime()) {
        return { valid: false, message: "End date cannot be before start date" };
    }
    const dayDifference = (endDate - startDate) / (1000 * 60 * 60 * 24);

    if (dayDifference > 20) {
        return { valid: false, message: "Booking cannot exceed 20 days" };
    }

    return { valid: true, message: "Booking data is valid" };
}



